import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { uploadCSV } from '../store/warehouseSlice';
import { UploadIcon } from '@heroicons/react/outline';

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
    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 200);
    dispatch(uploadCSV(file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: '.csv',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Загрузка данных инвентаризации
        </h2>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 rounded-lg text-center ${
            isDragActive
              ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/50'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-gray-600 dark:text-gray-300">
            Перетащите CSV файл сюда или нажмите для выбора
          </p>
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Формат: CSV с разделителем ";", кодировка: UTF-8<br />
          Обязательные колонки: product_id, product_name, quantity, zone, date
        </p>
        {previewData.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Предпросмотр (первые 5 строк):
            </h3>
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  {Object.keys(previewData[0]).map((key, index) => (
                    <th key={index} className="p-2 text-left text-gray-800 dark:text-gray-100">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-t dark:border-gray-600">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="p-2 text-gray-800 dark:text-gray-100">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={() => dispatch(uploadCSV(previewData))}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Загрузить
          </button>
        </div>
      </div>
    </div>
  );
}

export default CSVUploadModal;