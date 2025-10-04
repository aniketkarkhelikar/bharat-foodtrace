import QRCode from 'qrcode.react';

export default function QrCodeModal({ product, onClose }) {
  if (!product) return null;

  const handlePrint = () => {
    const qrCodeCanvas = document.getElementById('qrcode-canvas');
    if (qrCodeCanvas) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Print QR Code</title>
            <style>body { text-align: center; font-family: sans-serif; padding-top: 2rem; } img { max-width: 80%; } p { word-break: break-all; }</style>
            </head><body>
            <h2>QR Code for ${product.name}</h2>
            <img src="${qrCodeCanvas.toDataURL()}" />
            <p>${product.id}</p>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
        <h3 className="text-2xl font-bold mb-6">QR Code for {product.name}</h3>
        <div className="p-4 bg-white rounded-lg shadow-inner inline-block">
          <QRCode id="qrcode-canvas" value={product.id} size={200} level="H" />
        </div>
        <p className="mt-4 text-sm text-gray-600 break-all">{product.id}</p>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={handlePrint} className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800">
            Print
          </button>
          <button onClick={onClose} className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
