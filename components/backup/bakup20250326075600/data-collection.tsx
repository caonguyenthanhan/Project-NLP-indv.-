"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWorkflow } from "@/context/WorkflowProvider";
import { toast } from "react-toastify";
import axios from "axios";

export default function DataCollection() {
  const { addDataset } = useWorkflow();
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");

  // Danh sách dataset công khai để giới thiệu
  const publicDatasets = [
    {
      name: "IMDB Reviews",
      description: "Phân tích tình cảm (Sentiment Analysis)",
      labels: "positive/negative (tích cực/tiêu cực)",
    },
    {
      name: "News Articles (AG News)",
      description: "Phân loại văn bản (Text Classification)",
      labels: "4 chủ đề",
    },
    {
      name: "Twitter Sentiment",
      description: "Phân tích tình cảm (Sentiment Analysis)",
      labels: "positive/negative (tích cực/tiêu cực)",
    },
    {
      name: "SMS Spam",
      description: "Phát hiện spam (Spam Detection)",
      labels: "spam/ham",
    },
    {
      name: "BBC News",
      description: "Phân loại văn bản (Text Classification)",
      labels: "5 chủ đề",
    },
    {
      name: "Yelp Reviews",
      description: "Phân tích tình cảm chi tiết, Dự đoán xếp hạng",
      labels: "Xếp hạng sao (1-5 sao)",
    },
  ];

  // Xử lý khi người dùng nhập văn bản
  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      toast.error("Vui lòng nhập một đoạn văn bản!");
      return;
    }

    try {
      const newDataset = {
        name: `Manual_Text_${Date.now()}`,
        data: [{ text: textInput, label: null }],
        type: "raw",
      };
      addDataset(newDataset);
      toast.success("Đã thêm văn bản vào workflow!");
      setTextInput("");
    } catch (error) {
      toast.error("Lỗi khi thêm văn bản!");
      console.error(error);
    }
  };

  // Xử lý khi người dùng nhập URL để cào dữ liệu
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      toast.error("Vui lòng nhập một URL hợp lệ!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8000/scrape-url", {
        url: urlInput,
      });
      const scrapedData = response.data.data;

      if (!scrapedData || scrapedData.length === 0) {
        toast.error("Không tìm thấy dữ liệu từ URL!");
        return;
      }

      const newDataset = {
        name: `Scraped_${Date.now()}`,
        data: scrapedData.map((item: string) => ({ text: item, label: null })),
        type: "raw",
      };
      addDataset(newDataset);
      toast.success("Đã cào dữ liệu từ URL và thêm vào workflow!");
      setUrlInput("");
    } catch (error) {
      toast.error("Lỗi khi cào dữ liệu từ URL!");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Bước 1: Thu thập dữ liệu</h2>

      {/* Nhập văn bản */}
      <div className="space-y-2">
        <h3 className="text-lg">Nhập đoạn văn bản</h3>
        <Textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Nhập đoạn văn bản cần phân tích..."
          rows={5}
        />
        <Button onClick={handleTextSubmit}>Thêm văn bản</Button>
      </div>

      {/* Nhập URL */}
      <div className="space-y-2">
        <h3 className="text-lg">Cào dữ liệu từ URL</h3>
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Nhập URL (ví dụ: https://example.com)"
        />
        <Button onClick={handleUrlSubmit}>Cào dữ liệu</Button>
      </div>

      {/* Giới thiệu dataset công khai */}
      <div className="space-y-2">
        <h3 className="text-lg">Các bộ dữ liệu công khai (tham khảo)</h3>
        <p className="text-sm text-muted-foreground">
          Dưới đây là các bộ dữ liệu công khai phổ biến mà bạn có thể tham khảo để hiểu cách chúng được sử dụng:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          {publicDatasets.map((dataset) => (
            <li key={dataset.name}>
              <strong>{dataset.name}</strong>: {dataset.description} - Nhãn: {dataset.labels}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Bạn có thể tự thu thập dữ liệu tương tự bằng cách nhập văn bản hoặc cào từ web ở trên.
        </p>
      </div>
    </div>
  );
}