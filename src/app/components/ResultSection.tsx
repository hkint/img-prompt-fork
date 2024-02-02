import React, { FC, useState, useEffect } from "react";
import { Button, Input, message, Tooltip, Typography } from "antd";

interface Tag {
  attribute: string | undefined;
  displayName: string | undefined;
  langName: string | undefined;
  object: string | undefined;
}

interface ResultSectionProps {
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
  tagsData: Tag[];
}

const ResultSection: FC<ResultSectionProps> = ({ selectedTags = [], setSelectedTags, tagsData }) => {
  // 常量
  const NEGATIVE_TEXT =
    "lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy";
  const CONSTANT_TEXT_1 = "Natural Lighting, Studio lighting, Cinematic Lighting, Crepuscular Rays, X-Ray, Backlight";
  const CONSTANT_TEXT_2 =
    "insanely detailed and intricate, gorgeous, Surrealistic, smooth, sharp focus, Painting, Digital Art, Concept Art, Illustration, Trending on ArtStation, in a symbolic and meaningful style, 8K";

  useEffect(() => {
    setResultText(
      selectedTags
        .map((tag) => tag.displayName)
        .filter((displayName) => displayName && displayName.trim() !== "")
        .join(", ")
    );
  }, [selectedTags]);

  const [resultText, setResultText] = useState(selectedTags.map((tag) => tag.displayName).join(", "));
  const [charCount, setCharCount] = useState(resultText.length);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedTags.map((tag) => tag.displayName).join(", "));
    message.success("已复制到剪贴板");
  };

  const handleClear = () => {
    setSelectedTags([]);
    setCharCount(0);
    message.success("已清空结果框");
  };

  const handleNegativeCopy = () => {
    navigator.clipboard.writeText(NEGATIVE_TEXT);
    message.success("已复制否定提示");
  };

  // 更新 findTagData 函数
  const findTagData = (displayName: string) => {
    const foundTag = tagsData.find((tag) => tag.displayName?.toLowerCase() === displayName.toLowerCase());
    if (foundTag) {
      return {
        object: foundTag.object,
        attribute: foundTag.attribute,
        langName: foundTag.langName,
        displayName: foundTag.displayName,
      };
    }
    return {
      object: undefined,
      attribute: undefined,
      langName: undefined,
      displayName: undefined,
    };
  };

  // 更新 handleConstantText 函数
  const handleConstantText = (constantText: string) => {
    const newText = resultText ? resultText + ", " + constantText : constantText;
    const displayNames = newText.split(", ");
    const uniqueDisplayNames = Array.from(new Set(displayNames));

    const newSelectedTags = uniqueDisplayNames.map((displayName) => {
      const { object, attribute, langName, displayName: foundDisplayName } = findTagData(displayName);
      return {
        object,
        displayName: foundDisplayName || displayName,
        attribute,
        langName,
      };
    });

    setSelectedTags(newSelectedTags);
    setResultText(uniqueDisplayNames.join(", "));
    message.success("已插入指定文本");
    setCharCount(uniqueDisplayNames.join(", ").length);
  };

  // 更新 handleResultTextChange 函数
  const handleResultTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setResultText(newText);
    setCharCount(newText.length); // 更新 charCount
    const newSelectedTags = newText
      .split(", ")
      .filter((displayName) => displayName && displayName.trim() !== "")
      .map((displayName) => {
        const { object, attribute, langName } = findTagData(displayName);
        return { object, displayName, attribute, langName };
      });
    setSelectedTags(newSelectedTags);
  };

  const handleBlur = () => {
    // Replace symbols in text
    const replacedText = resultText
      .replace(/，/g, ", ")
      .replace(/,(\s{0,1})/g, ", ")
      .replace(/(,\s*){2,}/g, ", ");

    // Split text into display names and filter out empty or whitespace-only names
    const displayNames = replacedText.split(", ").filter((name) => name.trim() !== ""); // 过滤空值和仅包含空白字符的字符串

    // Remove duplicate items
    const uniqueDisplayNames = Array.from(new Set(displayNames.map((displayName) => displayName.toLowerCase())));

    const uniqueSelectedTags = uniqueDisplayNames.map((displayName) => {
      const { object, attribute, langName, displayName: foundDisplayName } = findTagData(displayName);
      return {
        object,
        displayName: foundDisplayName || displayName,
        attribute,
        langName,
      };
    });

    // Filter out any empty or undefined display names from the tags
    const filteredSelectedTags = uniqueSelectedTags.filter((tag) => tag.displayName && tag.displayName.trim() !== "");

    setSelectedTags(filteredSelectedTags);

    const newText = filteredSelectedTags.map((tag) => tag.displayName).join(", ");
    setResultText(newText);
    setCharCount(newText.length);
  };

  return (
    <div className="result-section">
      <Tooltip title="插入肖像常用光线">
        <Button className="m-1" onClick={() => handleConstantText(CONSTANT_TEXT_1)}>
          肖像光线
        </Button>
      </Tooltip>
      <Tooltip title="插入常用图像润色词">
        <Button className="m-1" onClick={() => handleConstantText(CONSTANT_TEXT_2)}>
          常用润色
        </Button>
      </Tooltip>
      <Tooltip title="复制 Negative prompt 否定提示">
        <Button className="m-1" onClick={handleNegativeCopy}>
          否定提示
        </Button>
      </Tooltip>

      <Button className="m-1" onClick={handleCopy}>
        复制
      </Button>
      <Button className="m-1" onClick={handleClear}>
        清空
      </Button>
      <Input.TextArea
        value={resultText}
        readOnly={false}
        onChange={handleResultTextChange}
        onBlur={handleBlur}
        rows={10}
        className="w-full h-96 mt-4"
        style={{ backgroundColor: "black", color: "#68D391" }}
      />
      <Typography.Text style={{ color: charCount > 380 ? "red" : "inherit" }} className="mt-2">
        {charCount}/380
      </Typography.Text>
      <Typography.Paragraph type="secondary">
        Tips：Prompt 中的词语顺序代表其权重，越靠前权重越大。物体不要太多，两到三个就好。若要特别强调某个元素，可以加很多括号或者惊叹号，比如 beautiful forest background, desert!!, (((sunset)))
        中会优先体现「desert」和「sunset」元素。
        <br />
        假设你在提示词中使用了 mountain，生成的图像很可能会有树。但如果你想要生成没有树的山的图像，可以使用 mountain | tree:-10。其中 tree:-10 表示对于树的权重非常负，因此生成的图像中不会出现树。
      </Typography.Paragraph>
    </div>
  );
};

export default ResultSection;
