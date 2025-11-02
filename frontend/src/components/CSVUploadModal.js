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
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  // Функция для сброса состояния
  const resetState = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setUploadProgress(0);
    setError('');
  };

  // Функция для обработки закрытия модального окна
  const handleClose = () => {
    resetState();
    onClose();
  };

  // Функция для проверки типа файла
  const isValidFileType = (file) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/csv',
      'text/x-csv',
      'application/x-csv',
      'text/comma-separated-values',
      'text/x-comma-separated-values'
    ];
    
    // Проверяем MIME type и расширение файла
    const isCSVType = allowedTypes.includes(file.type);
    const hasCSVExtension = file.name.toLowerCase().endsWith('.csv');
    
    return isCSVType || hasCSVExtension;
  };

  const onDrop = (acceptedFiles, rejectedFiles) => {
    setError(''); // Сбрасываем ошибку
    
    // Проверяем отклоненные файлы
    if (rejectedFiles && rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Пожалуйста, выберите файл в формате CSV');
        return;
      }
    }

    const file = acceptedFiles[0];
    
    // Дополнительная проверка типа файла
    if (!isValidFileType(file)) {
      setError('Неверный формат файла. Пожалуйста, выберите CSV файл.');
      return;
    }

    setSelectedFile(file);
    
    // Только предпросмотр, без автоматической загрузки
    Papa.parse(file, {
      complete: (result) => {
        setPreviewData(result.data.slice(0, 5));
      },
      header: true,
      delimiter: ';',
      encoding: 'UTF-8',
      error: (error) => {
        setError(`Ошибка чтения CSV файла: ${error.message}`);
      }
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    // Проверяем тип файла перед загрузкой
    if (!isValidFileType(selectedFile)) {
      setError('Неверный формат файла. Пожалуйста, выберите CSV файл.');
      return;
    }

    // Сбрасываем прогресс и ошибки
    setUploadProgress(0);
    setError('');

    // Симуляция прогресса
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 200);
    
    try {
      await dispatch(uploadCSV(selectedFile)).unwrap();
      // Закрываем модальное окно после успешной загрузки
      handleClose();
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setError(`Ошибка загрузки: ${error.message}`);
      setUploadProgress(0); // Сбрасываем прогресс при ошибке
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    multiple: false
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Загрузка данных инвентаризации
        </h2>
        
        {/* Область перетаскивания */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer ${
            isDragActive
              ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/50'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <input {...getInputProps()} />
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300" />
          <p className="text-gray-600 dark:text-gray-300">
            Перетащите CSV файл сюда или нажмите для выбора
          </p>
        </div>

        {/* Отображение ошибок */}
        {error && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded text-sm">
            {error}
          </div>
        )}

        {/* Информация о формате */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Формат: CSV с разделителем ";", кодировка: UTF-8<br />
          Обязательные колонки: product_id, product_name, quantity
        </p>

        {/* Предпросмотр (только если файл выбран) */}
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

        {/* Прогресс загрузки */}
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

        {/* Кнопки действий */}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleClose}
            className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadProgress > 0 || error}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadProgress > 0 ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CSVUploadModal;