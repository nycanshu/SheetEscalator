import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Available columns for filter generation
const AVAILABLE_COLUMNS = [
  { key: 'department', label: 'Department', type: 'string' },
  { key: 'fileActivity', label: 'File/Activity', type: 'string' },
  { key: 'currentLevel', label: 'Current Level', type: 'string' },
  { key: 'pendingSince', label: 'Pending Since (Days)', type: 'number' },
  { key: 'tatDays', label: 'TAT (Days)', type: 'number' },
  { key: 'nextLevel', label: 'Next Level', type: 'string' },
  { key: 'escalationEmail', label: 'Escalation Authority Email', type: 'string' },
  { key: 'remarks', label: 'Remarks', type: 'string' },
  { key: 'mailSent', label: 'Mail Sent Status', type: 'boolean' }
];

const OPERATORS = {
  string: ['equals', 'contains'],
  number: ['equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'column_equals', 'column_greater_than', 'column_less_than', 'column_greater_equal', 'column_less_equal'],
  boolean: ['equals']
};

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY ;
    console.log('API Key check:', apiKey ? `Present (${apiKey.length} chars)` : 'Missing');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Construct the system prompt (optimized for token usage)
    const systemPrompt = `Convert natural language to filter conditions.

Columns: ${AVAILABLE_COLUMNS.map(col => `${col.key}(${col.type})`).join(', ')}

Operators: string(equals,contains), number(equals,greater_than,less_than,greater_equal,less_equal,column_*), boolean(equals)

Rules:
- Column comparisons: use column_* operators with compareColumn
- Strings: 'contains' for partial, 'equals' for exact
- Numbers: use appropriate comparison operators
- Booleans: 'equals' with 'true'/'false'
- Default logic: AND

Format:
{"filters":[{"id":"id","conditions":[{"column":"key","operator":"op","value":0,"compareColumn":"key"}],"logic":"AND"}]}

Query: ${prompt.trim()}

JSON only:`;

    // Generate content
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Get token usage information (for internal tracking only)
    const usageMetadata = response.usageMetadata;

    // Parse the JSON response
    let parsedResponse;
    try {
      // Clean the response text (remove markdown code blocks if present)
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!parsedResponse.filters || !Array.isArray(parsedResponse.filters)) {
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    // Validate each filter group
    for (const filterGroup of parsedResponse.filters) {
      if (!filterGroup.id || !filterGroup.conditions || !Array.isArray(filterGroup.conditions)) {
        return NextResponse.json(
          { error: 'Invalid filter group structure' },
          { status: 500 }
        );
      }

      // Validate each condition
      for (const condition of filterGroup.conditions) {
        const validColumns = AVAILABLE_COLUMNS.map(col => col.key);
        if (!validColumns.includes(condition.column)) {
          return NextResponse.json(
            { error: `Invalid column: ${condition.column}` },
            { status: 500 }
          );
        }

        const columnType = AVAILABLE_COLUMNS.find(col => col.key === condition.column)?.type;
        const validOperators = OPERATORS[columnType as keyof typeof OPERATORS] || [];
        if (!validOperators.includes(condition.operator)) {
          return NextResponse.json(
            { error: `Invalid operator for ${condition.column}: ${condition.operator}` },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ 
      filters: parsedResponse.filters
    });

  } catch (error) {
    console.error('Error generating filters with Gemini:', error);
    return NextResponse.json(
      { error: 'Failed to generate filters with AI' },
      { status: 500 }
    );
  }
}
