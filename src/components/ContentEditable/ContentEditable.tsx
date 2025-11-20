"use client";
import { useEffect, useRef } from "react";
import styled from "styled-components";

const Content = styled.div<{
  fontSize?: number;
  fontFamily?: string;
  width?: number;
}>`
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

export default function ReadContent({
  fontSize,
  width,
  defaultContent,
  onChange,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Khi defaultContent thay đổi → cập nhật lại UI
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerText = defaultContent;
    }
  }, [defaultContent]);

  return (
    <div className="relative text-gray-100 pb-10">
      <Content
        ref={contentRef}
        fontSize={fontSize}
        width={width}
        contentEditable={true}
        suppressContentEditableWarning
        onInput={(e) => {
          const value = (e.target as HTMLDivElement).innerText;
          onChange(value);
        }}
      />
    </div>
  );
}
