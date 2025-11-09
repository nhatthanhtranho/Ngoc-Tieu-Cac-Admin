"use client";
import { useEffect, useRef } from "react";
import styled from "styled-components";

const Content = styled.div<{ fontSize?: number; fontFamily?: string; width?: number }>`
  margin: 0 auto;
  outline: none;
  white-space: pre-wrap;
  min-height: 100vh;
  color: #f1f1f1;
  line-height: 1.8;
  padding: 1.5rem;
  border-radius: 0.5rem;
  font-size: ${(props) => props.fontSize ?? 18}px;
  font-family: ${(props) => props.fontFamily ?? "inherit"};
  width: ${(props) => (props.width ? `${props.width}px` : "100%")};
`;

interface Props {
  fontSize?: number;
  width?: number;
  fontFamily?: string;
  defaultContent: string;
  isEditMode?: boolean;
  onChange: (content: string) => void;
}

export default function ContentEditableSection({
  defaultContent,
  isEditMode = true,
  onChange,
  fontSize,
  width,
  fontFamily
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Khi parent thay đổi defaultContent, update div
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== defaultContent) {
      contentRef.current.innerHTML = defaultContent;
    }
  }, [defaultContent]);

  const handleInput = () => {
    if (!contentRef.current) return;
    onChange(contentRef.current.innerHTML); // báo content mới cho parent
  };

  return (
    <Content
      ref={contentRef}
      contentEditable={isEditMode}
      suppressContentEditableWarning
      spellCheck={false}
      onInput={isEditMode ? handleInput : undefined}
      fontSize={fontSize}
      width={width}
      fontFamily={fontFamily}
    />
  );
}
