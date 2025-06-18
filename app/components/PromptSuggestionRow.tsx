import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionRow = ({ onPromptClick }) => {
    const prompts = [
        "What is the current F1 season?",
        "Who is the new driver of Ferrari?",
        "What are the upcoming races?",
        "Who is the highest paid f1 driver?",
        "What is the fastest lap in F1 history?",
    ]
    return (
       <div className="prompt-suggestion-row">
           {prompts.map((prompt, index) => (
               <PromptSuggestionButton key={`suggestion-${index}`} text={prompt} onClick={() => onPromptClick(prompt)}  />
           ))}
       </div>
    );
};

export default PromptSuggestionRow;
