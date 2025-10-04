import { useState, useEffect } from 'react';
import { addTraceabilityEvent } from '../lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function LogisticsPage() {
    const [view, setView] = useState('scan'); // 'scan' or 'form'
    const [productId, setProductId] = useState('');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isScannerActive, setScannerActive] = useState(false);

    useEffect(() => {
        if (view === 'scan' && isScannerActive) {
            const qrScanner = new Html5QrcodeScanner(
                'qr-reader',
                { fps: 10, qrbox: 250 },
                false // verbose = false
            );

            const onScanSuccess = (decodedText, decodedResult) => {
                setProductId(decodedText);
                setView('form');
                qrScanner.clear();
                setScannerActive(false);
            };

            const onScanFailure = (error) => {
                // console.warn(`QR error = ${error}`);
            };

            qrScanner.render(onScanSuccess, onScanFailure);

            return () => {
                if (qrScanner) {
                   try {
                     qrScanner.clear();
                   } catch (e) {
                     console.error("Failed to clear scanner on unmount", e)
                   }
                }
            };
        }
    }, [view, isScannerActive]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updateData = Object.fromEntries(formData.entries());
        updateData.actor = "Logistics Partner";
        
        setStatusMessage({ type: 'info', text: 'Submitting log...' });

        try {
            await addTraceabilityEvent(updateData);
            setStatusMessage({ type: 'success', text: `Successfully logged event for Product ID: ${updateData.product_id}` });
            setTimeout(() => {
                setView('scan');
                setStatusMessage({ type: '', text: '' });
            }, 3000);
        } catch (err) {
            setStatusMessage({ type: 'error', text: err.message });
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <Link href="/">
                        <Image src="/logo.png" alt="Bharat FoodTrace Logo" width={64} height={64} className="mx-auto cursor-pointer" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800 mt-4">Bharat FoodTrace</h1>
                    <p className="text-gray-500">Logistics Portal</p>
                </div>

                {view === 'scan' && (
                    <div className="fade-in space-y-6 text-center">
                        <h2 className="text-2xl font-bold">Update Product Location</h2>
                        <p>Scan a product's QR code to add a new entry to its traceability log.</p>
                        
                        {!isScannerActive ? (
                            <button onClick={() => setScannerActive(true)} className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all">
                                Start Scanning
                            </button>
                        ) : (
                             <button onClick={() => {setScannerActive(false); setView('scan');}} className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-all">
                                Cancel Scan
                            </button>
                        )}
                        
                        <div id="qr-reader" className={isScannerActive ? '' : 'hidden'}></div>
                    </div>
                )}

                {view === 'form' && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-bold mb-4">Add Traceability Log</h2>
                        <form id="logistics-form" onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Product ID</label>
                                <input type="text" name="product_id" value={productId} readOnly className="mt-1 w-full p-2 border bg-gray-100 rounded-lg" />
                            </div>
                             <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Current Location (GLN if available)</label>
                                <input type="text" id="location" name="location" required placeholder="e.g., Delhi Warehouse" className="mt-1 w-full p-2 border border-gray-300 rounded-lg"/>
                            </div>
                            <div>
                                <label htmlFor="stage" className="block text-sm font-medium text-gray-700">Stage</label>
                                <select id="stage" name="stage" required className="mt-1 w-full p-2 border border-gray-300 rounded-lg">
                                    <option value="distribution">Distribution</option>
                                    <option value="warehousing">Warehousing</option>
                                    <option value="transport">In Transport</option>
                                    <option value="retail">Retail</option>
                                </select>
                            </div>
                             <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                <select id="status" name="status" required className="mt-1 w-full p-2 border border-gray-300 rounded-lg">
                                    <option value="In Transit">In Transit</option>
                                    <option value="Received">Received</option>
                                    <option value="Damaged">Damaged</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                <textarea id="notes" name="notes" rows="2" placeholder="e.g., 'Box corner crushed'" className="mt-1 w-full p-2 border border-gray-300 rounded-lg"></textarea>
                            </div>

                            <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700">Submit Log</button>
                            <button type="button" onClick={() => setView('scan')} className="w-full mt-2 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600">Scan Another</button>
                        </form>
                    </div>
                )}

                 {statusMessage.text && (
                    <div className={`p-4 rounded-lg text-center mt-4 ${
                        statusMessage.type === 'success' ? 'bg-green-100 text-green-800' :
                        statusMessage.type === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                        {statusMessage.text}
                    </div>
                )}
            </div>
        </div>
    );
}
