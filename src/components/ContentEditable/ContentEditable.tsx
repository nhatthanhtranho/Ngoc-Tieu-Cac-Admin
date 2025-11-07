"use client";
import { useEffect, useRef } from "react";
import styled from "styled-components";

const Content = styled.div`
  margin: 0 auto;
  outline: none;
  white-space: pre-wrap;
  transition: color 0.3s ease;
  min-height: 100vh;
  color: #f1f1f1;
  line-height: 1.8;
  padding: 1.5rem;
  border-radius: 0.5rem;
  font-size: 1.125rem;
`;

interface Props {
  fontSize?: number;
  width?: number;
  fontFamily?: string;
  defaultContent: string;
  isEditMode?: boolean;
  onSave?: (content: string) => void;
}

export default function ContentEditableSection({
  defaultContent,
  isEditMode = true,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const contentHTML = useRef<string>(defaultContent);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = defaultContent;
      contentHTML.current = defaultContent;
    }
  }, [defaultContent]);

  const handleInput = () => {
    if (!contentRef.current) return;
    contentHTML.current = contentRef.current.innerHTML;
  };

  return (
    <>
      <Content
        ref={contentRef}
        contentEditable={isEditMode}
        suppressContentEditableWarning
        spellCheck={false} // ✅ tắt kiểm tra chính tả (bỏ gạch đỏ)
        onInput={isEditMode ? handleInput : undefined}
      />
    </>
  );
}
