export interface Document {
  id: string;
  name: string;
  title: string;
  content: string;
  body: string;
  owner?: {
    id: string;
    name: string;
    imgUrl: string;
  };
  description: string;
  isReported: boolean;
  isDeleted: boolean;
  reportCount: number;
  imgUrl: string;
  imgUrls?: string[];
  createdAt: string;
  type: "post" | "comment" | "community";
}

export interface GetDocumentsResponse {
  getDocuments: {
    success: boolean;
    message: string;
    data: Document[];
  };
}

export interface UpdateDocumentResponse {
  updateDocument: {
    success: boolean;
    message: string;
  };
}

export interface GetDocumentResponse {
  getDocumentById: {
    success: boolean;
    message: string;
    data: Document;
  };
}
