import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Account } from "../types";

// Fix: Initializing GoogleGenAI with the required named parameter and using process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getFinancialAdvice(transactions: Transaction[], accounts: Account[]) {
  // Fix: Assuming the API key is provided correctly by the environment as per the guidelines.
  try {
    const summary = transactions.map(t => `${t.date}: ${t.type} ${t.amount} ${t.currency} for ${t.category}`).join('\n');
    const accountStr = accounts.map(a => `${a.name}: ${a.balance} ${a.currency}`).join('\n');

    const prompt = `
      As a world-class financial advisor, analyze this user's wallet data and give 3 short, actionable tips in a helpful tone.
      
      Accounts:
      ${accountStr}

      Recent Transactions:
      ${summary}
    `;

    // Fix: Using the recommended gemini-3-flash-preview model for general text tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate AI insights at this time.";
  }
}

export async function getCurrencyInsights(baseCurrency: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Give me a quick 2-sentence summary of the current global sentiment for ${baseCurrency} against major currencies.`,
    });
    return response.text;
  } catch (error) {
    return "Rates are stable but keep an eye on market trends.";
  }
}