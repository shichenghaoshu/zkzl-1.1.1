# Keyou DeepSeek Lesson Generation Skill

## Purpose

Generate a real, editable interactive lesson JSON for Chinese primary-school teachers.

## Runtime

- Provider: DeepSeek
- Base URL: `https://api.deepseek.com`
- Endpoint: `/chat/completions`
- Response format: JSON object

## Inputs

- `topic`: lesson topic
- `grade`: school stage
- `subject`: subject
- `mode`: game mode
- `studentCount`: class size

## Output Contract

Return one JSON object only:

```json
{
  "title": "string",
  "grade": "string",
  "subject": "string",
  "gameMode": "string",
  "scenes": [
    {
      "type": "story | drag-classify | match | quiz-race | boss",
      "title": "string",
      "description": "string",
      "questions": [
        {
          "prompt": "string",
          "options": ["string", "string", "string"],
          "answer": "string",
          "explanation": "string"
        }
      ],
      "rewards": {
        "stars": 3,
        "coins": 20
      }
    }
  ]
}
```

## Generation Rules

- Generate exactly 5 scenes.
- Each scene must contain 1-3 editable questions.
- Question prompts must be concrete and classroom-ready.
- Options must be short and suitable for primary-school students.
- The answer must match an option or be an explicit answer text.
- Explanations must be 1-2 sentences.
- Content must fit Chinese primary-school teaching contexts.
- Do not include Markdown, comments, apologies, or prose outside the JSON object.

## Editing Assumptions

The frontend editor can edit:

- scene title
- scene description
- first question prompt
- options
- answer
- explanation
- reward stars

Therefore every generated lesson must include enough structured data for these fields.
