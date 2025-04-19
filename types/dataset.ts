export interface Dataset {
  id: string;
  name: string;
  type: string;
  data: Array<{ text: string; [key: string]: any }>;
  metadata: {
    source: string;
    createdAt: string;
    size: number;
    [key: string]: any;
  };
} 