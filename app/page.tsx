"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileText, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

interface ImageFile{
  file: File
  id: string
  preview: string
}

export default function ImageToPdfConverter() {
  const [isConverting, setIsConverting] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<ImageFile[]>([])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newImages: ImageFile[] = Array.from(event.target.files).map((file) => ({
        file, // Keep a reference to the actual File object
        id: `${file.name}-${crypto.randomUUID()}`,
        preview: URL.createObjectURL(file),
      }));
  
      setImages((prevImages) => [...prevImages, ...newImages]);
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsConverting(true);
    setError(null);
    setDownloadUrl(null);
  
    const formData = new FormData();
  
    images.forEach((image) => {
      formData.append("images", image.file); // Make sure it's `image.file`
    });
  
    console.log("Sending files:", formData.getAll("images")); // Debugging
  
    try {
      const response = await fetch("https://image-to-pdf-fcfj.onrender.com/convert", {
        method: "POST",
        body: formData,
      });
  
      console.log("Response status:", response.status);
  
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      } else {
        const errorText = await response.text();
        setError(`Failed to convert images. Server error: ${errorText}`);
      }
    } catch (err) {
      setError("An error occurred. Please try again." + err);
    } finally {
      setIsConverting(false);
    }
  };

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !result.draggableId) return; // Ensure a valid drag
      setImages((prevImages) => {
        const newImages = [...prevImages];
        const [reorderedItem] = newImages.splice(result.source.index, 1);
        if (result.destination != undefined){
        newImages.splice(result.destination.index, 0, reorderedItem);
        }
        return newImages;
      });
    },
    [setImages],
  )

  const removeImage = useCallback((id: string) => {
    setImages((prevImages) => prevImages.filter((image) => image.id !== id))
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold mb-1">
            Image to PDF Converter
          </div>
          <h1 className="block mt-1 text-lg leading-tight font-medium text-black">Convert your images to PDF</h1>
          <p className="mt-2 text-gray-500">
            Upload multiple images, arrange them, and we&apos;ll combine them into a single PDF file.
          </p>
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF, JPEG, BMP, TIFF upto 10MB each</p>
                </div>
                <Input
                  id="file-upload"
                  name="images"
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {images.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">Image Preview</h2>
                <p className="text-sm text-gray-500">Drag and drop to reorder images</p>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="images" direction="horizontal">
                    {(provided) => (
                      <ul
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
                      >
                        {images.map((image, index) => (
                          <Draggable key={image.id} draggableId={image.id} index={index}>
                            {(provided) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="relative"
                              >
                                <img
                                  src={image.preview || "/placeholder.svg"}
                                  alt={`Preview ${index + 1}`}
                                  className="h-24 w-24 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(image.id)}
                                  className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}

            <div className="mt-6">
              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4"
                disabled={isConverting || images.length === 0}
              >
                {isConverting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Converting...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Convert to PDF
                  </>
                )}
              </Button>
            </div>
          </form>
          {downloadUrl && (
            <div className="mt-6">
              <Button asChild className="w-full">
                <a href={downloadUrl} download="converted.pdf">
                  Download PDF
                </a>
              </Button>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}

