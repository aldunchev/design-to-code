# I want to take into another level.

## Here is the high overview plan:

### Implement UI for the tokens and components extraction.

- Simple form to specify the file key.
- Preview of the extracted tokens and components.
- For the UI use shadcn/ui components
- Button to download the extracted tokens and components - optional.

### Implement AI-powered generation of the json files.

- Use OPENAI API to generate the json files based on specific prompt I will specify.
- Possibility to upload the screenshot from which the AI will generate the json files.
- So we needed UI for this as well.

### The idea is to have two approaches:

1. Generate the json files from the Figma API provided file key - which we have right now.
2. Generate the json files based on the screenshot with the help of the AI.

### Next steps

#### Provide the json output to Cursor AI to generate the actual UI based on the json files, either generated from AI or the query to Figma API(which is already in place).

#### Enhancements/Questions

- Automate the process of handover the generated JSON to Cursor AI.
- What I imagine is to have the program generate the JSON files based on AI or Figma API than once the user is happy with the output to be able to trigger Cursor from the UI and automatically pass the JSON to Cursor and Cursor to code the UI based on the JSON. - Cursor, may you advise if this is feasible and how technically can be achieved?

Your App → OpenAI Vision API → JSON Generation → File Export → Cursor Integration
