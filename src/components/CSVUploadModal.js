import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { uploadCSV } from '../store/warehouseSlice';

function CSVUploadModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [previewData, setPreviewData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    Papa.parse(file, {
      complete: (result) => {
        setPreviewData(result.data.slice(0, 5));
      },
      header: true,
      delimiter: ';',
      encoding: 'UTF-8',
    });
    // Симуляция прогресса
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 200);
    dispatch(uploadCSV(file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: '.csv' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Загрузка данных инвентаризации</h2>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 rounded-lg text-center ${
            isDragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-gray-600">
            Перетащите CSV файл сюда или нажмите для выбора
          </p>
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Формат: CSV с разделителем ";", кодировка: UTF-8<br />
          Обязательные колонки: product_id, product_name, quantity, zone, date
        </p>
        {previewData.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold">Предпросмотр (первые 5 строк):</h3>
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="bg-gray-100">
                  {Object.keys(previewData[0]).map((key, index) => (
                    <th key={index} className="p-2 text-left">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-t">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="p-2">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Отмена
          </button>
          <button
            onClick={() => dispatch(uploadCSV(previewData))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Загрузить
          </button>
        </div>
      </div>
    </div>
  );
}

export default CSVUploadModal;