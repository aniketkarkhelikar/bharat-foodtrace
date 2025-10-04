import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getManufacturerProducts, addProduct, addRecall } from '../../lib/api';
import Header from '../../components/Header';
import Loader from '../../components/Loader';
import ProductCard from '../../components/ProductCard';
import QrCodeModal from '../../components/QrCodeModal';
import { jwtDecode } from 'jwt-decode';

export default function ManufacturerDashboard() {
    const [userEmail, setUserEmail] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('list'); // 'list', 'form', 'detail'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [qrModalProduct, setQrModalProduct] = useState(null);
    const router = useRouter();

    const fetchProducts = async () => {
        const token = localStorage.getItem('manufacturerAuthToken');
        if (!token) return;
        try {
            setLoading(true);
            const data = await getManufacturerProducts(token);
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('manufacturerAuthToken');
        if (!token) {
            router.push('/manufacturer/login');
            return;
        }
        try {
            const decoded = jwtDecode(token);
            setUserEmail(decoded.sub);
            fetchProducts();
        } catch (e) {
            console.error("Invalid token:", e);
            localStorage.removeItem('manufacturerAuthToken');
            router.push('/manufacturer/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('manufacturerAuthToken');
        router.push('/manufacturer/login');
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('manufacturerAuthToken');
        const formStatusDiv = document.getElementById('form-status');
        formStatusDiv.textContent = 'Submitting...';
        formStatusDiv.className = 'p-4 rounded-lg text-center text-yellow-800 bg-yellow-100 block';
        
        const formData = new FormData(e.target);
        
        const productData = {
            name: formData.get('name'),
            brand: formData.get('brand'),
            category: formData.get('category'),
            sub_category: formData.get('sub_category'),
            image_url: formData.get('image_url'),
            ingredients: formData.get('ingredients').split(',').map(s => s.trim()),
            batch_number: formData.get('batch_number'),
            manufacturing_date: formData.get('manufacturing_date'),
            expiry_date: formData.get('expiry_date'),
            mrp: parseFloat(formData.get('mrp')),
            net_weight: formData.get('net_weight'),
            nutrition: {
                sodium: parseInt(formData.get('sodium')),
                sugar: parseInt(formData.get('sugar')),
                calories_per_100g: parseInt(formData.get('calories_per_100g')),
                protein_g: parseFloat(formData.get('protein_g')),
                carbs_g: parseFloat(formData.get('carbs_g')),
                fat_g: parseFloat(formData.get('fat_g')),
                fiber_g: parseFloat(formData.get('fiber_g')),
            },
            allergens: {
                contains_peanuts: formData.get('contains_peanuts') === 'on',
                contains_tree_nuts: formData.get('contains_tree_nuts') === 'on',
                contains_milk: formData.get('contains_milk') === 'on',
                contains_eggs: formData.get('contains_eggs') === 'on',
                contains_fish: formData.get('contains_fish') === 'on',
                contains_shellfish: formData.get('contains_shellfish') === 'on',
                contains_wheat: formData.get('contains_wheat') === 'on',
                contains_soy: formData.get('contains_soy') === 'on',
            },
            certifications: {
                organic_certified: formData.get('organic_certified') === 'on',
                fssai_license: formData.get('fssai_license'),
                iso_certification: formData.get('iso_certification') || null,
            }
        };

        try {
            const newProduct = await addProduct(token, productData);
            setProducts([newProduct, ...products]);
            formStatusDiv.className = 'p-4 rounded-lg text-center bg-green-100 text-green-800 block';
            formStatusDiv.textContent = `Success! Product "${newProduct.name}" added.`;
            e.target.reset();
            setTimeout(() => {
                setView('list');
            }, 2000);
        } catch (err) {
            setError(err.message);
            formStatusDiv.textContent = `Error: ${err.message}`;
            formStatusDiv.className = 'p-4 rounded-lg text-center bg-red-100 text-red-800 block';
        }
    };
    
    const handleRecallSubmit = async (e, batchNumber) => {
        e.preventDefault();
        const token = localStorage.getItem('manufacturerAuthToken');
        const reason = e.target.reason.value;
        const recallStatusDiv = document.getElementById('recall-status');
        
        recallStatusDiv.textContent = 'Issuing recall...';
        recallStatusDiv.className = 'text-sm mt-2 h-4 text-yellow-700';

        try {
            await addRecall(token, { batch_number: batchNumber, reason });
            recallStatusDiv.textContent = 'Recall issued successfully!';
            recallStatusDiv.className = 'text-sm mt-2 h-4 text-green-700';
            
            setTimeout(async () => {
                const updatedProducts = await getManufacturerProducts(token);
                setProducts(updatedProducts);
                const updatedSelectedProduct = updatedProducts.find(p => p.id === selectedProduct.id);
                setSelectedProduct(updatedSelectedProduct);
            }, 1500);

        } catch (err) {
            recallStatusDiv.textContent = `Error: ${err.message}`;
            recallStatusDiv.className = 'text-sm mt-2 h-4 text-red-700';
        }
    };

    const renderListView = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-3xl font-bold">Your Products</h2>
                <div id="product-count" className="text-gray-500 font-semibold">
                    {products.length} product(s) found
                </div>
            </div>
            {loading ? <Loader /> : (
                <div id="product-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.length === 0 ? (
                        <p className="text-center text-gray-500 col-span-full py-10">You haven't added any products yet. Click "+ Add New Product" to get started.</p>
                    ) : (
                        products.map(product => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                onShowQr={(id, name) => setQrModalProduct({ id, name })}
                                onViewDetails={(id) => {
                                    setSelectedProduct(products.find(p => p.id === id));
                                    setView('detail');
                                }}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
    
    const renderFormView = () => (
         <div className="fade-in space-y-6 bg-white p-8 rounded-lg shadow-inner border">
            <h2 className="text-3xl font-bold border-b pb-4">Add New Product Details</h2>
            <form onSubmit={handleAddProduct} className="space-y-8 text-sm">
                <fieldset>
                    <legend className="text-lg font-semibold mb-2">Basic Information</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required name="name" type="text" placeholder="Product Name" className="w-full p-2 border rounded-lg"/>
                        <input required name="brand" type="text" placeholder="Brand Name" className="w-full p-2 border rounded-lg"/>
                        <input required name="category" type="text" placeholder="Category" className="w-full p-2 border rounded-lg"/>
                        <input required name="sub_category" type="text" placeholder="Sub-category" className="w-full p-2 border rounded-lg"/>
                        <input required name="image_url" type="text" placeholder="Image URL" defaultValue="https://placehold.co/400x300/FBBF24/000000?text=Product" className="w-full p-2 border rounded-lg col-span-1 md:col-span-2"/>
                        <textarea required name="ingredients" placeholder="Ingredients (comma-separated)" className="w-full p-2 border rounded-lg col-span-1 md:col-span-2"></textarea>
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="text-lg font-semibold mb-2">Manufacturing Details</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required name="batch_number" type="text" placeholder="Batch Number" className="w-full p-2 border rounded-lg"/>
                        <input required name="net_weight" type="text" placeholder="Net Weight (e.g., 250g)" className="w-full p-2 border rounded-lg"/>
                        <div><label className="block text-gray-500">Manufacturing Date</label><input required name="manufacturing_date" type="date" className="w-full p-2 border rounded-lg"/></div>
                        <div><label className="block text-gray-500">Expiry Date</label><input required name="expiry_date" type="date" className="w-full p-2 border rounded-lg"/></div>
                        <input required name="mrp" type="number" step="0.01" placeholder="MRP (₹)" className="w-full p-2 border rounded-lg"/>
                    </div>
                </fieldset>

                 <fieldset>
                    <legend className="text-lg font-semibold mb-2">Nutrition (per 100g)</legend>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input required name="calories_per_100g" type="number" placeholder="Calories" className="w-full p-2 border rounded-lg"/>
                        <input required name="protein_g" type="number" step="0.1" placeholder="Protein (g)" className="w-full p-2 border rounded-lg"/>
                        <input required name="carbs_g" type="number" step="0.1" placeholder="Carbs (g)" className="w-full p-2 border rounded-lg"/>
                        <input required name="fat_g" type="number" step="0.1" placeholder="Fat (g)" className="w-full p-2 border rounded-lg"/>
                        <input required name="fiber_g" type="number" step="0.1" placeholder="Fiber (g)" className="w-full p-2 border rounded-lg"/>
                        <input required name="sodium" type="number" placeholder="Sodium (mg)" className="w-full p-2 border rounded-lg"/>
                        <input required name="sugar" type="number" placeholder="Sugar (g)" className="w-full p-2 border rounded-lg"/>
                    </div>
                </fieldset>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <fieldset>
                        <legend className="text-lg font-semibold mb-2">Allergens</legend>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center"><input type="checkbox" name="contains_peanuts" className="h-4 w-4 rounded"/> <span className="ml-2">Peanuts</span></label>
                            <label className="flex items-center"><input type="checkbox" name="contains_tree_nuts" className="h-4 w-4 rounded"/> <span className="ml-2">Tree Nuts</span></label>
                            <label className="flex items-center"><input type="checkbox" name="contains_milk" className="h-4 w-4 rounded"/> <span className="ml-2">Milk</span></label>
                            <label className="flex items-center"><input type="checkbox" name="contains_eggs" className="h-4 w-4 rounded"/> <span className="ml-2">Eggs</span></label>
                            <label className="flex items-center"><input type="checkbox" name="contains_fish" className="h-4 w-4 rounded"/> <span className="ml-2">Fish</span></label>
                            <label className="flex items-center"><input type="checkbox" name="contains_shellfish" className="h-4 w-4 rounded"/> <span className="ml-2">Shellfish</span></label>
                            <label className="flex items-center"><input type="checkbox" name="contains_wheat" className="h-4 w-4 rounded"/> <span className="ml-2">Wheat</span></label>
                            <label className="flex items-center"><input type="checkbox" name="contains_soy" className="h-4 w-4 rounded"/> <span className="ml-2">Soy</span></label>
                        </div>
                    </fieldset>
                    <fieldset>
                        <legend className="text-lg font-semibold mb-2">Certifications</legend>
                        <input required name="fssai_license" type="text" placeholder="FSSAI License" className="w-full p-2 border rounded-lg mb-2"/>
                        <input name="iso_certification" type="text" placeholder="ISO Certification (Optional)" className="w-full p-2 border rounded-lg mb-2"/>
                        <label className="flex items-center"><input type="checkbox" name="organic_certified" className="h-4 w-4 rounded"/> <span className="ml-2">Organic Certified</span></label>
                    </fieldset>
                </div>
                
                <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">Submit Product</button>
                <div id="form-status" className="p-4 rounded-lg text-center hidden"></div>
            </form>
        </div>
    );

    const renderDetailView = () => {
        if (!selectedProduct) return null;

        const { traceability, reviews, recalls, batch_number } = selectedProduct;
        
        return (
            <div className="fade-in space-y-6">
                <button onClick={() => setView('list')} className="text-secondary font-semibold">&larr; Back to Product List</button>
                <div className="text-center">
                    <h2 className="text-3xl font-bold">{selectedProduct.name}</h2>
                    <p className="text-lg text-gray-600">Batch Number: {batch_number}</p>
                </div>
                
                {recalls.length > 0 && recalls.map(r => (
                    <div key={r.recall_id} className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                        <p className="font-bold">Recall Issued on {new Date(r.recall_date).toLocaleDateString()}</p>
                        <p>{r.reason}</p>
                    </div>
                ))}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg shadow p-4"><h3 className="font-bold text-lg mb-2">Reviews</h3>
                            {reviews.length > 0 ? reviews.map(r => (
                                <div key={r.review_id} className="p-2 border-b">
                                    <p><strong>Rating: {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</strong> by {r.consumer_email.split('@')[0]}...</p>
                                    <p className="text-sm italic">"{r.comment}"</p>
                                </div>
                            )) : <p className="text-gray-500">No reviews yet.</p>}
                        </div>
                        <div className="bg-white rounded-lg shadow p-4"><h3 className="font-bold text-lg mb-2">Recall This Batch</h3>
                            {recalls.length > 0 ? <p className="text-red-600 font-semibold">A recall has already been issued for this batch.</p> : (
                                <form id="recall-form" onSubmit={(e) => handleRecallSubmit(e, batch_number)}>
                                    <textarea name="reason" required placeholder="Reason for recall..." className="w-full p-2 border rounded-lg mb-2"></textarea>
                                    <button type="submit" className="w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700">Issue Recall</button>
                                    <div id="recall-status" className="text-sm mt-2 h-4"></div>
                                </form>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="bg-white rounded-lg shadow p-4"><h3 className="font-bold text-lg mb-4">Traceability Log</h3>
                            <ul className="trace-list">
                                {traceability.map(log => (
                                    <li key={log.log_id} className="trace-item">
                                        <p className="font-semibold capitalize">{log.stage}: {log.location}</p>
                                        <p className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()} by {log.actor}</p>
                                        {log.notes && <p className="text-sm text-blue-600 mt-1">Notes: {log.notes}</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header userEmail={userEmail} userType="manufacturer" onLogout={handleLogout} />
            <main className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
                <div className="flex justify-end gap-4">
                    <button onClick={() => setView(view === 'form' ? 'list' : 'form')} className={`font-bold py-2 px-6 rounded-lg transition-all ${view === 'form' ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-secondary text-white hover:bg-blue-600'}`}>
                        {view === 'form' ? 'Cancel' : '+ Add New Product'}
                    </button>
                </div>

                {error && <div className="p-4 bg-red-100 text-red-800 rounded-lg">{error}</div>}
                
                {view === 'list' && renderListView()}
                {view === 'form' && renderFormView()}
                {view === 'detail' && renderDetailView()}
            </main>
            {qrModalProduct && <QrCodeModal product={qrModalProduct} onClose={() => setQrModalProduct(null)} />}
        </div>
    );
}
