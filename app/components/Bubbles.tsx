import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Bubble = ({message}) => {
    const {content,role} = message;
    return (
        <div className={`bubble ${role === "user" ? "user-bubble" : "assistant-bubble"}`}>
             <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
             </div>
        </div>
    );
};

export default Bubble;
