import Image from 'next/image';

export default function ProductCard({ product, onShowQr, onViewDetails }) {
  return (
    <div className="bg-white rounded-lg shadow-md border flex flex-col hover:shadow-lg transition-shadow">
      <div className="relative w-full h-40">
        <Image 
            src={product.image_url} 
            alt={product.name} 
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
        />
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
        <p className="text-sm text-gray-600">{product.brand} | {product.category}</p>
        <div className="mt-2 text-xs text-gray-500">
          <p>Batch: {product.batch_number}</p>
          <p>MRP: ₹{product.mrp.toFixed(2)}</p>
        </div>
        <div className="mt-auto pt-4 space-y-2">
            <button onClick={() => onViewDetails(product.id)} className="w-full bg-gray-200 text-gray-800 text-sm font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                View Details
            </button>
            <button onClick={() => onShowQr(product.id, product.name)} className="w-full bg-accent text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                Show QR Code
            </button>
        </div>
      </div>
    </div>
  );
}
