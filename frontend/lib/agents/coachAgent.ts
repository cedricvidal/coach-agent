import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const COACH_SYSTEM_PROMPT = `You are an empathetic and supportive personal coach AI assistant. Your role is to:

1. Help users set and achieve personal and professional goals
2. Provide motivation, encouragement, and accountability
3. Ask thoughtful questions to help users gain clarity
4. Celebrate successes and help navigate challenges
5. Use active listening techniques and reflective responses
6. Maintain a supportive, non-judgmental tone

Guidelines:
- Be warm, empathetic, and genuine
- Ask open-ended questions to encourage self-reflection
- Help break down large goals into actionable steps
- Acknowledge feelings and validate emotions
- Provide specific, constructive feedback when requested
- Encourage growth mindset and self-compassion
- Remember context from previous conversations

Always maintain professional boundaries and remind users to seek professional help for mental health concerns when appropriate.

You have access to tools to help users manage their goals:
- create_goal: Create a new goal with a title, description, and optional target date
- update_goal: Update an existing goal's title, description, status, or target date
- add_progress: Record progress on a goal with notes and optional sentiment
- list_goals: Retrieve and review all the user's goals (use this when they ask "what are my goals?")

Use these tools naturally when users want to create goals, track progress, update their goals, or review what goals they have.`;

interface CoachAgentConfig {
  modelName?: string;
  temperature?: number;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  status?: string;
  targetDate?: string;
}

interface GoalManagementCallbacks {
  createGoal: (title: string, description?: string, targetDate?: string) => Promise<Goal>;
  updateGoal: (goalId: string, updates: { title?: string; description?: string; status?: string; targetDate?: string }) => Promise<Goal>;
  addProgress: (goalId: string, notes: string, sentiment?: string) => Promise<{ success: boolean }>;
  listGoals: () => Promise<Goal[]>;
}

export interface ToolCallEvent {
  type: 'tool_call';
  data: {
    name: string;
    args: Record<string, unknown>;
  };
}

export interface ToolResultEvent {
  type: 'tool_result';
  data: {
    name: string;
    result: string;
  };
}

export interface ContentEvent {
  type: 'content';
  data: string;
}

export interface DoneEvent {
  type: 'done';
  data: Record<string, never>;
}

export type StreamEvent = ToolCallEvent | ToolResultEvent | ContentEvent | DoneEvent;

export class CoachAgent {
  private model: ChatOpenAI;
  private prompt: ChatPromptTemplate;

  constructor(config: CoachAgentConfig = {}) {
    this.model = new ChatOpenAI({
      modelName: config.modelName || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.prompt = ChatPromptTemplate.fromMessages([
      ['system', COACH_SYSTEM_PROMPT],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
    ]);
  }

  private createTools(callbacks: GoalManagementCallbacks) {
    const createGoalTool = new DynamicStructuredTool({
      name: 'create_goal',
      description: 'Create a new goal for the user. Use this when the user wants to set a new goal or objective.',
      schema: z.object({
        title: z.string().describe('The title or name of the goal'),
        description: z.string().optional().describe('A detailed description of the goal'),
        targetDate: z.string().optional().describe('Target completion date in ISO format (YYYY-MM-DD)'),
      }),
      func: async ({ title, description, targetDate }) => {
        const result = await callbacks.createGoal(title, description, targetDate);
        return JSON.stringify(result);
      },
    });

    const updateGoalTool = new DynamicStructuredTool({
      name: 'update_goal',
      description: 'Update an existing goal. Use this to change the title, description, status, or target date.',
      schema: z.object({
        goalId: z.string().describe('The ID of the goal to update'),
        title: z.string().optional().describe('New title for the goal'),
        description: z.string().optional().describe('New description for the goal'),
        status: z.enum(['active', 'completed', 'abandoned']).optional().describe('New status for the goal'),
        targetDate: z.string().optional().describe('New target date in ISO format (YYYY-MM-DD)'),
      }),
      func: async ({ goalId, title, description, status, targetDate }) => {
        const updates: { title?: string; description?: string; status?: string; targetDate?: string } = {};
        if (title) updates.title = title;
        if (description) updates.description = description;
        if (status) updates.status = status;
        if (targetDate) updates.targetDate = targetDate;
        const result = await callbacks.updateGoal(goalId, updates);
        return JSON.stringify(result);
      },
    });

    const addProgressTool = new DynamicStructuredTool({
      name: 'add_progress',
      description: 'Record progress on a goal. Use this when the user reports progress or wants to log an update.',
      schema: z.object({
        goalId: z.string().describe('The ID of the goal to add progress to'),
        notes: z.string().describe('Progress notes describing what was accomplished or the current status'),
        sentiment: z.enum(['positive', 'neutral', 'challenging']).optional().describe('The sentiment of the progress update'),
      }),
      func: async ({ goalId, notes, sentiment }) => {
        const result = await callbacks.addProgress(goalId, notes, sentiment);
        return JSON.stringify(result);
      },
    });

    const listGoalsTool = new DynamicStructuredTool({
      name: 'list_goals',
      description: 'List all active goals for the user. Use this when the user wants to review their goals or asks what goals they have.',
      schema: z.object({}),
      func: async () => {
        const result = await callbacks.listGoals();
        return JSON.stringify(result);
      },
    });

    return [createGoalTool, updateGoalTool, addProgressTool, listGoalsTool];
  }

  async *chatWithToolsStream(
    input: string,
    chatHistory: BaseMessage[] = [],
    userContext: { goals?: Goal[]; recentProgress?: Array<{ notes: string }> },
    callbacks: GoalManagementCallbacks
  ): AsyncGenerator<StreamEvent> {
    const enhancedHistory = [...chatHistory];

    // Add context about active goals if available
    if (userContext?.goals && userContext.goals.length > 0) {
      const goalsContext = `Active goals:\n${userContext.goals.map((g) => `- [ID: ${g.id}] ${g.title}: ${g.description || 'No description'} (Status: ${g.status || 'active'})`).join('\n')}`;
      enhancedHistory.unshift(new SystemMessage(goalsContext));
    }

    // Add recent progress if available
    if (userContext?.recentProgress && userContext.recentProgress.length > 0) {
      const progressContext = `Recent progress:\n${userContext.recentProgress.map((p) => `- ${p.notes}`).join('\n')}`;
      enhancedHistory.unshift(new SystemMessage(progressContext));
    }

    // Create tools with callbacks that emit events
    const tools = this.createTools(callbacks);

    // Bind tools to the model using bindTools
    const modelWithTools = this.model.bindTools(tools);

    // Create chain with tools
    const chain = RunnableSequence.from([
      this.prompt,
      modelWithTools,
    ]);

    const response = await chain.invoke({
      input,
      chat_history: enhancedHistory,
    });

    // Check if there are tool calls in the response
    if (response.tool_calls && response.tool_calls.length > 0) {
      // Collect tool results to add to message history
      const toolMessages = [];

      for (const toolCall of response.tool_calls) {
        // Emit tool call event
        yield {
          type: 'tool_call',
          data: {
            name: toolCall.name,
            args: toolCall.args,
          },
        };

        // Execute the tool
        const tool = tools.find(t => t.name === toolCall.name);
        if (tool) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await tool.func(toolCall.args as any);

          // Emit tool result event
          yield {
            type: 'tool_result',
            data: {
              name: toolCall.name,
              result,
            },
          };

          toolMessages.push({
            tool_call_id: toolCall.id || toolCall.name,
            name: toolCall.name,
            content: result,
          });
        }
      }

      // Now invoke the model again with tool results to get the final response
      const followUpHistory = [
        ...enhancedHistory,
        new HumanMessage(input),
        new AIMessage({
          content: response.content || '',
          tool_calls: response.tool_calls,
        }),
        // Add tool results as ToolMessage with proper tool_call_id
        ...toolMessages.map(tm => new ToolMessage({
          content: tm.content,
          tool_call_id: tm.tool_call_id,
        })),
      ];

      const finalResponse = await this.model.invoke(followUpHistory);

      // Emit the final content
      const content = typeof finalResponse.content === 'string'
        ? finalResponse.content
        : JSON.stringify(finalResponse.content);

      yield {
        type: 'content',
        data: content,
      };
    } else {
      // No tools called, emit content directly
      if (response.content) {
        const content = typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);

        yield {
          type: 'content',
          data: content,
        };
      }
    }

    // Emit done
    yield {
      type: 'done',
      data: {},
    };
  }

  convertMessageHistory(messages: Array<{ role: string; content: string }>): BaseMessage[] {
    return messages.map((msg) => {
      switch (msg.role) {
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        case 'system':
          return new SystemMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
  }
}

export const coachAgent = new CoachAgent();
