import {useCallback} from "react";
import {useEffect} from "react";
import React, {DragEvent, KeyboardEvent, useState} from "react";
import "./Styles.css";
import {v4 as uuId} from "uuid";
import Links from "./components/Links.tsx";
import Popover from "./components/Popover.tsx";
import {PARAGRAPH_KEY} from "./Types.ts";
import {IPopoverCss} from "./Types.ts";
import {ILink} from "./Types.ts";
import {IParagraph} from "./Types.ts";
import {saveToLocalStorage} from "./components/Utils.ts";
import {getLocalStorageData} from "./components/Utils.ts";

export default function TextEditor()
{
  const [paragraphs, setParagraphs] = useState<IParagraph[]>(getLocalStorageData(PARAGRAPH_KEY));
  const [links, setLinks] = useState<ILink[]>([]);
  const [popoverCss, setPopoverCss] = useState<IPopoverCss | undefined>();

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLParagraphElement>, index: number) =>
  {
    if(e.key === "Enter" && e.shiftKey)
    {
      // Shift + Enter pressed
      // Perform your action here
    }
    else if(e.key === "Enter")
    {
      const newId = uuId();
      e.preventDefault();
      const newParagraphs = [...paragraphs];
      newParagraphs.splice(index + 1,
        0,
        {
          id: newId,
          content: "",
          text: ""
        }
      );
      setParagraphs(newParagraphs);
      setTimeout(() =>
      {
        const paragraph = document.getElementById(newId);
        console.log(paragraph);
        if(paragraph)
        {
          paragraph.focus();
        }
      });
    }
  }, []);

  const handleInputChange = useCallback((e: React.FocusEvent<HTMLParagraphElement, Element>, id: string) =>
  {
    const content = e.target.innerHTML;
    const text = e.target.innerText;
    const newParagraphs = paragraphs.map((p) =>
      p.id === id ? {
        ...p,
        content: content,
        text: text
      } : p
    );
    setParagraphs(newParagraphs);
    saveToLocalStorage(PARAGRAPH_KEY, newParagraphs);
  }, [paragraphs]);

  const calculateLinks = useCallback(() =>
  {
    const matchedLinks: ILink[] = [];
   // const regex = /\((?<text>.*?)\)\[<(?<url>.*?)>\]/g;
    const regex = /\((?<text>.*?)\)\[&lt;(?<url>.*?)&gt;\]/g;
    paragraphs.forEach(paragraph =>
    {
      let match;
      while((match = regex.exec(paragraph.content)) !== null && match.groups)
      {
        matchedLinks.push({
          text: match.groups.text,
          url: match.groups.url
        });
      }
    });
    setLinks(matchedLinks);
  }, [paragraphs]);

  const handleDragStart = (e: DragEvent<HTMLParagraphElement>, id: string) =>
  {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLParagraphElement>) =>
  {
    e.preventDefault();
  };

  const handleDrop = useCallback((e: DragEvent<HTMLParagraphElement>, dropId: string) =>
  {
    const dragId = e.dataTransfer.getData("text/plain");
    if(!dragId) return;
    const dragIndex = paragraphs.findIndex((p) => p.id === dragId);
    const dropIndex = paragraphs.findIndex((p) => p.id === dropId);
    if(dragIndex === dropIndex)
    {
      return;
    }

    const updatedParagraphs = [...paragraphs];

    const draggedItem = updatedParagraphs.splice(dragIndex, 1)[0];

    const adjustedDropIndex = dropIndex > dragIndex ? dropIndex - 1 : dropIndex;

    updatedParagraphs.splice(adjustedDropIndex, 0, draggedItem);

    setParagraphs(updatedParagraphs);
    saveToLocalStorage(PARAGRAPH_KEY, updatedParagraphs);
  }, [paragraphs]);

  const showPopover = useCallback((e: React.MouseEvent<HTMLParagraphElement>) =>
  {
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    setPopoverCss({
      top: scrollY + e.clientY + "px",
      left: scrollX + e.clientX + "px",
      display: "flex"
    });
  }, []);

  const handleDelete = useCallback((id: string) =>
  {
    if(!id || paragraphs.length <= 1) return;
    const newParagraph = paragraphs.filter(paragraph => paragraph.id != id);
    setParagraphs(newParagraph);
    saveToLocalStorage(PARAGRAPH_KEY, newParagraph);
  }, [paragraphs]);

  useEffect(() =>
  {
    calculateLinks();
  }, [paragraphs]);

  return (
    <div className="App">
      <h1 className={"title"}>📝Text Editor</h1>
      <div className="editor">
        {paragraphs.map(({
          id,
          content
        }, index) => (
          <div className={"paragraph-container"}>
            <p
              key={id}
              id={id.toString()}
              className="paragraph"
              draggable
              onDoubleClick={showPopover}
              onDragStart={(e) => handleDragStart(e, id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, id)}
              contentEditable
              onBlur={(e) => handleInputChange(e, id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              dangerouslySetInnerHTML={{__html: content}}
            />
            <button className={"delete"} onClick={() => handleDelete(id)}>✖</button>
            {(!content || content.trim() === "") && (
              <span className="placeholder">Enter your text here...</span>
            )}
          </div>
        ))}
      </div>
      <Popover position={popoverCss} />
      <Links links={links} />
    </div>
  );
}
