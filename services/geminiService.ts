import { GoogleGenAI, Type } from "@google/genai";
import { Habit, HabitLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeHabits = async (habits: Habit[], logs: HabitLog[]): Promise<any> => {
  const today = new Date().toISOString().split('T')[0];
  
  // Prepare data context for AI
  const contextData = {
    currentDate: today,
    habits: habits.map(h => ({
      name: h.name,
      target: h.targetFrequency,
      description: h.description
    })),
    recentLogs: logs.filter(l => {
      const logDate = new Date(l.date);
      const todayDate = new Date();
      const diffTime = Math.abs(todayDate.getTime() - logDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 14; // Last 2 weeks
    })
  };

  const prompt = `
    당신은 제임스 클리어의 베스트셀러 저서 **『아주 작은 습관의 힘(Atomic Habits)』**의 철학을 완벽하게 이해하고 실천하는 습관 코치입니다.
    사용자의 데이터(습관 목록과 최근 2주간의 수행 기록)를 분석하여, 책의 핵심 개념(정체성 중심 습관, 1%의 법칙, 행동 변화의 4가지 법칙 등)을 적용한 피드백을 제공해주세요.

    사용자 데이터: ${JSON.stringify(contextData)}

    다음 요구사항에 맞춰 JSON 형식으로 응답해주세요:
    
    1. **summary (전체 요약)**: 
       - 단순히 "잘했습니다"가 아니라, 사용자가 수행한 습관이 그들이 되고자 하는 **'정체성(Identity)'**에 어떻게 투표하고 있는지 설명하세요.
       - 성과가 잘 보이지 않는다면 **'잠재력의 고원(Plateau of Latent Potential)'** 개념을 언급하며 격려하세요.
    
    2. **tips (구체적인 팁 3가지)**: 
       - 책에 나오는 구체적인 전략을 제안하세요.
       - 예: **습관 쌓기(Habit Stacking)** (현재 습관 + 새로운 습관), **2분 규칙(Two-Minute Rule)**, **환경 디자인**, **유혹 묶기(Temptation Bundling)** 등.
       - 행동 변화의 4가지 법칙(분명하게, 매력적으로, 하기 쉽게, 만족스럽게) 중 부족한 부분을 지적하고 해결책을 제시하세요.

    3. **motivation (동기부여)**: 
       - 『아주 작은 습관의 힘』 책에 나오는 명언이나, 제임스 클리어 특유의 간결하고 통찰력 있는 문체를 사용한 메시지를 작성하세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Overall summary focusing on identity and small wins" },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 actionable tips based on Atomic Habits principles"
            },
            motivation: { type: Type.STRING, description: "Motivational quote from James Clear or similar style" }
          },
          required: ["summary", "tips", "motivation"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw error;
  }
};

export const getHabitSuggestion = async (goal: string): Promise<Partial<Habit>[]> => {
  const prompt = `
    사용자가 "${goal}"라는 목표를 가지고 있습니다.
    이 목표를 달성하기 위해 도움이 될만한 작은 습관 3가지를 추천해주세요.
    각 습관은 구체적이고 실행 가능해야 합니다.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Short habit name" },
              description: { type: Type.STRING, description: "Why this helps" },
              targetFrequency: { type: Type.INTEGER, description: "Recommended days per week (1-7)" }
            }
          }
        }
      }
    });

     const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
     console.error("Gemini suggestion failed:", error);
     return [];
  }
}

export const generateRetrospective = async (
  period: 'WEEKLY' | 'MONTHLY',
  dateRange: { start: string; end: string },
  habits: Habit[],
  logs: HabitLog[]
): Promise<string> => {
  // Filter logs for the given period
  const relevantLogs = logs.filter(l => l.date >= dateRange.start && l.date <= dateRange.end);
  
  // Calculate stats per habit
  const stats = habits.map(h => {
    const completedCount = relevantLogs.filter(l => l.habitId === h.id && l.completed).length;
    return {
      name: h.name,
      target: h.targetFrequency,
      completed: completedCount
    };
  });

  const prompt = `
    역할: 당신은 제임스 클리어의 『아주 작은 습관의 힘』 철학을 기반으로 하는 습관 회고 파트너입니다.
    작업: 사용자의 습관 데이터를 분석하여 Markdown 형식의 회고록을 작성해주세요.
    
    기간: ${period === 'WEEKLY' ? '주간 회고' : '월간 회고'} (${dateRange.start} ~ ${dateRange.end})
    
    데이터:
    ${JSON.stringify(stats, null, 2)}
    
    요구사항:
    1. Markdown 포맷을 완벽하게 준수하세요.
    2. 내용은 다음 섹션으로 구성하세요:
       - # 📅 기간 요약 (정체성과 시스템 관점에서 평가)
       - ## 📈 1%의 성장 (잘된 습관 칭찬 - 만족스러움의 법칙)
       - ## 🔧 시스템 점검 (부족한 습관에 대한 환경/프로세스 개선점 제안)
       - ## 🚀 다음 ${period === 'WEEKLY' ? '주' : '달'}의 실행 의도 (Implementation Intentions)
    3. 말투는 통찰력 있고 격려하는 톤을 사용하세요.
    4. 불필요한 서론 없이 바로 Markdown 내용만 출력하세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      // Note: Not asking for JSON here, but raw markdown string
    });
    
    return response.text || "회고를 생성하지 못했습니다.";
  } catch (error) {
    console.error("Retrospective generation failed:", error);
    throw error;
  }
};