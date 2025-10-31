import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

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

Always maintain professional boundaries and remind users to seek professional help for mental health concerns when appropriate.`;

interface CoachAgentConfig {
  modelName?: string;
  temperature?: number;
}

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

  async chat(input: string, chatHistory: BaseMessage[] = []): Promise<string> {
    const chain = RunnableSequence.from([
      this.prompt,
      this.model,
    ]);

    const response = await chain.invoke({
      input,
      chat_history: chatHistory,
    });

    return response.content as string;
  }

  async chatWithContext(
    input: string,
    chatHistory: BaseMessage[] = [],
    userContext?: { goals?: any[]; recentProgress?: any[] }
  ): Promise<string> {
    let enhancedHistory = [...chatHistory];

    // Add context about active goals if available
    if (userContext?.goals && userContext.goals.length > 0) {
      const goalsContext = `Active goals:\n${userContext.goals.map((g) => `- ${g.title}: ${g.description || 'No description'}`).join('\n')}`;
      enhancedHistory.unshift(new SystemMessage(goalsContext));
    }

    // Add recent progress if available
    if (userContext?.recentProgress && userContext.recentProgress.length > 0) {
      const progressContext = `Recent progress:\n${userContext.recentProgress.map((p) => `- ${p.notes}`).join('\n')}`;
      enhancedHistory.unshift(new SystemMessage(progressContext));
    }

    return this.chat(input, enhancedHistory);
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
