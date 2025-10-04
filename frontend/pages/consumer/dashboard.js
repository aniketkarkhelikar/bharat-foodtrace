import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import { getConsumerProfile, updateConsumerProfile, getProductDetails, addReview } from '../../lib/api';
import Header from '../../components/Header';
import Loader from '../../components/Loader';
import BioCard from '../../components/swasth/BioCard';
import HealthCard from '../../components/swasth/HealthCard';
import GoalsCard from '../../components/swasth/GoalsCard';

export default function ConsumerDashboard() {
    const [view, setView] = useState('loading'); // loading, quiz, scanner, profile, product
    const [user, setUser] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [product, setProduct] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [scannerInput, setScannerInput] = useState('');
    const [review, setReview] = useState({ rating: 0, comment: ''});
    const [reviewStatus, setReviewStatus] = useState('');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('consumerAuthToken');
        if (!token) {
            router.push('/consumer/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const profileData = await getConsumerProfile(token);
                setUser({ email: profileData.email });
                setWallet(profileData.profile);
                const phase1Complete = profileData.profile.allergies?.length > 0 || profileData.profile.diet?.length > 0 || profileData.profile.conditions?.length > 0;
                setView(phase1Complete ? 'scanner' : 'quiz');
            } catch (error) {
                console.error("Failed to fetch profile:", error);
                localStorage.removeItem('consumerAuthToken');
                router.push('/consumer/login');
            }
        };

        fetchProfile();
    }, [router]);
    
    const handleLogout = () => {
        localStorage.removeItem('consumerAuthToken');
        router.push('/consumer/login');
    };

    const handleQuizSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('consumerAuthToken');
        const formData = new FormData(e.target);
        const updatedWallet = {
            ...wallet,
            allergies: formData.getAll('allergies'),
            diet: formData.getAll('diet'),
            conditions: formData.getAll('conditions'),
        };
        try {
            const data = await updateConsumerProfile(token, updatedWallet);
            setWallet(data.profile);
            setView('scanner');
        } catch (error) {
            alert("Failed to save profile: " + error.message);
        }
    };
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('consumerAuthToken');
        const formData = new FormData(e.target);
        const updatedWallet = {
            ...wallet,
            allergies: formData.getAll('allergies'),
            diet: formData.getAll('diet'),
            conditions: formData.getAll('conditions'),
            age: formData.get('age') ? parseInt(formData.get('age')) : null,
            gender: formData.get('gender'),
            height_cm: formData.get('height_cm') ? parseInt(formData.get('height_cm')) : null,
            weight_kg: formData.get('weight_kg') ? parseFloat(formData.get('weight_kg')) : null,
            activity_level: formData.get('activity_level'),
            goals: formData.getAll('goals'),
        };
        try {
            const data = await updateConsumerProfile(token, updatedWallet);
            setWallet(data.profile);
            setIsEditingProfile(false);
        } catch (error) {
            alert("Failed to update profile: " + error.message);
        }
    };

    const handleScan = async (productId) => {
        if (!productId) return;
        setView('loading');
        try {
            const productData = await getProductDetails(productId);
            setProduct(productData);
            analyzeProduct(productData);
            setView('product');
        } catch (error) {
            alert("Failed to get product details: " + error.message);
            setView('scanner');
        }
    };

    const analyzeProduct = (productData) => {
        let issues = [];
        if (productData.recalls && productData.recalls.length > 0) {
            issues.push({ type: 'recall', message: `PRODUCT RECALLED: ${productData.recalls[0].reason}` });
        }
        for (const allergenKey in productData.allergens) {
            const allergenName = allergenKey.replace('contains_', '');
            if (productData.allergens[allergenKey] && wallet.allergies?.includes(allergenName)) {
                const friendlyName = allergenName.replace('_', ' ');
                issues.push({ type: 'danger', message: `Contains ${friendlyName.charAt(0).toUpperCase() + friendlyName.slice(1)}` });
            }
        }
        if (productData.nutrition.sodium > 400 && wallet.conditions?.includes("high blood pressure")) {
            issues.push({ type: 'warning', message: 'High Sodium Content' });
        }
        if (productData.nutrition.sugar > 10 && wallet.conditions?.includes("diabetes")) {
            issues.push({ type: 'warning', message: 'High Sugar Content' });
        }
        if (productData.allergens.contains_wheat && wallet.conditions?.includes("celiac disease")) {
            issues.push({ type: 'danger', message: 'Contains Gluten (Celiac Disease)' });
        }
        if (issues.length === 0) {
            issues.push({ type: 'safe', message: 'No Major Concerns Found based on your profile.' });
        }
        setAnalysis({ issues });
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('consumerAuthToken');
        if (!review.rating) {
            setReviewStatus('Please select a rating.');
            return;
        }
        setReviewStatus('Submitting...');
        try {
            const reviewData = {
                product_id: product.id,
                rating: parseInt(review.rating),
                comment: review.comment,
            };
            await addReview(token, reviewData);
            setReviewStatus('Review submitted successfully!');
            // Refresh product data to show new review
            setTimeout(async () => {
                const updatedProduct = await getProductDetails(product.id);
                setProduct(updatedProduct);
                setReviewStatus('');
                setReview({ rating: 0, comment: '' });
            }, 2000);
        } catch (err) {
            setReviewStatus('Error: ' + err.message);
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'loading':
                return <Loader text="Loading your profile..." />;
            case 'quiz':
                return renderQuizView();
            case 'scanner':
                return renderScannerView();
            case 'profile':
                return renderProfileView();
            case 'product':
                return renderProductView();
            default:
                return <Loader />;
        }
    };
    
    const renderQuizView = () => (
        <div className="fade-in space-y-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-gray-800">Create Your Swasth Wallet</h2>
                <p className="text-gray-600 mt-2">Answer these critical questions for your safety and to receive personalized advice.</p>
            </div>
            <form onSubmit={handleQuizSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
                <div>
                    <label className="font-semibold text-gray-700 block mb-2">1. Do you have any food allergies?</label>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="allergies" value="peanuts" className="h-4 w-4"/> <span className="ml-2">Peanuts</span></label>
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="allergies" value="tree_nuts" className="h-4 w-4"/> <span className="ml-2">Tree Nuts</span></label>
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="allergies" value="milk" className="h-4 w-4"/> <span className="ml-2">Milk (Lactose)</span></label>
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="allergies" value="eggs" className="h-4 w-4"/> <span className="ml-2">Eggs</span></label>
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="allergies" value="fish" className="h-4 w-4"/> <span className="ml-2">Fish</span></label>
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="allergies" value="shellfish" className="h-4 w-4"/> <span className="ml-2">Shellfish</span></label>
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="allergies" value="wheat" className="h-4 w-4"/> <span className="ml-2">Wheat (Gluten)</span></label>
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="allergies" value="soy" className="h-4 w-4"/> <span className="ml-2">Soy</span></label>
                    </div>
                </div>
                <div>
                    <label className="font-semibold text-gray-700 block mb-2">2. What are your primary dietary preferences?</label>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                         <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="diet" value="vegetarian"/> <span className="ml-2">Vegetarian</span></label>
                         <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="diet" value="vegan"/> <span className="ml-2">Vegan</span></label>
                         <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="diet" value="jain"/> <span className="ml-2">Jain</span></label>
                    </div>
                </div>
                <div>
                    <label className="font-semibold text-gray-700 block mb-2">3. Do you have any major health conditions?</label>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="conditions" value="diabetes"/> <span className="ml-2">Diabetes (Type 1 or 2)</span></label>
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="conditions" value="high blood pressure"/> <span className="ml-2">High Blood Pressure</span></label>
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="conditions" value="high cholesterol"/> <span className="ml-2">High Cholesterol</span></label>
                        <label className="flex items-center p-2 rounded-lg border hover:bg-gray-50"><input type="checkbox" name="conditions" value="celiac disease"/> <span className="ml-2">Celiac Disease</span></label>
                    </div>
                </div>
                <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-all">Save & Start Scanning</button>
            </form>
        </div>
    );
    
    const renderScannerView = () => (
        <div className="text-center fade-in space-y-6">
             <div className="bg-green-50 border border-green-200 rounded-lg p-8 flex flex-col items-center shadow-md">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Scan Food Products</h2>
                <p className="text-gray-600 mb-6 max-w-sm">Enter a Product ID below to simulate scanning a QR code.</p>
                 <form onSubmit={(e) => { e.preventDefault(); handleScan(scannerInput); }} className="w-full flex gap-2">
                    <input 
                        type="text" 
                        value={scannerInput}
                        onChange={(e) => setScannerInput(e.target.value)}
                        placeholder="Paste Product ID here"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <button type="submit" className="bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600">
                        Look Up
                    </button>
                </form>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md">
                 <button onClick={() => setView('profile')} className="text-blue-600 font-semibold w-full text-center">
                    View & Complete your Swasth Wallet
                </button>
            </div>
        </div>
    );
    
    const renderProfileView = () => (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-gray-800">Swasth Wallet</h2>
                <button onClick={() => setView('scanner')} className="text-blue-600 font-semibold">&larr; Back to Scanner</button>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-5">
                 <div className="flex justify-end gap-3">
                    {!isEditingProfile ? (
                        <button type="button" onClick={() => setIsEditingProfile(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Edit Profile</button>
                    ) : (
                        <>
                            <button type="submit" className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Save Changes</button>
                            <button type="button" onClick={() => setIsEditingProfile(false)} className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600">Cancel</button>
                        </>
                    )}
                </div>
                
                <BioCard wallet={wallet} isEditing={isEditingProfile} />
                <HealthCard wallet={wallet} isEditing={isEditingProfile} />
                <GoalsCard wallet={wallet} isEditing={isEditingProfile} />
            </form>
        </div>
    );

    const renderProductView = () => {
        if (!product) return <Loader text="Fetching product data..." />;
        
        const issueTypeClasses = {
            recall: 'text-white bg-red-600',
            danger: 'text-red-800 bg-red-100',
            warning: 'text-yellow-800 bg-yellow-100',
            safe: 'text-green-800 bg-green-100'
        };

        return (
            <div className="fade-in space-y-6">
                <button onClick={() => setView('scanner')} className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">&larr; Scan Another Product</button>
                
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover"/>
                    <div className="p-6 text-center">
                        <h2 className="text-3xl font-bold text-gray-800">{product.name}</h2>
                        <p className="text-lg text-gray-500">{product.brand} | {product.category}</p>
                        <div className="flex justify-center gap-4 text-sm text-gray-600 mt-2">
                            <span>Batch: {product.batch_number}</span>
                            <span>MRP: ₹{product.mrp.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6"><h3 className="font-bold text-xl mb-4 text-gray-800 border-b pb-2">Health Analysis</h3>
                    <ul className="space-y-3">
                        {analysis?.issues.map((issue, index) => (
                            <li key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${issueTypeClasses[issue.type]}`}>
                                <div className="font-bold text-xl">&#9888;</div>
                                <div><strong>{issue.message}</strong></div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow p-4"><h3 className="font-bold text-lg mb-2">Ingredients</h3><p className="text-gray-600 text-sm">{product.ingredients.join(', ')}</p></div>
                
                <div className="bg-white rounded-lg shadow p-4"><h3 className="font-bold text-lg mb-2">Nutrition Facts (per 100g)</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                        <span><strong>Calories:</strong> {product.nutrition.calories_per_100g}</span>
                        <span><strong>Protein:</strong> {product.nutrition.protein_g}g</span>
                        <span><strong>Carbs:</strong> {product.nutrition.carbs_g}g</span>
                        <span><strong>Fat:</strong> {product.nutrition.fat_g}g</span>
                        <span><strong>Fiber:</strong> {product.nutrition.fiber_g}g</span>
                        <span><strong>Sodium:</strong> {product.nutrition.sodium}mg</span>
                        <span><strong>Sugar:</strong> {product.nutrition.sugar}g</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4"><h3 className="font-bold text-lg mb-2">Reviews & Feedback</h3>
                    <div className="max-h-48 overflow-y-auto mb-4 border-b">
                        {product.reviews.length > 0 ? product.reviews.map(r => (
                            <div key={r.review_id} className="p-2 border-t">
                                <p><strong>Rating: {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</strong></p>
                                <p className="text-xs text-gray-500">by {r.consumer_email.split('@')[0]}... on {new Date(r.review_date).toLocaleDateString()}</p>
                                <p className="text-sm italic mt-1">"{r.comment}"</p>
                            </div>
                        )) : <p className="text-gray-500 p-3">No reviews yet. Be the first!</p>}
                    </div>
                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                        <div className="flex justify-center">
                            {[5, 4, 3, 2, 1].map(star => (
                                <label key={star} className={`text-3xl cursor-pointer ${review.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    <input type="radio" name="rating" value={star} checked={review.rating === star} onChange={() => setReview({...review, rating: star})} className="hidden" />
                                    ★
                                </label>
                            ))}
                        </div>
                        <textarea value={review.comment} onChange={(e) => setReview({...review, comment: e.target.value})} rows="3" placeholder="Share your experience..." className="w-full p-2 border rounded-lg"></textarea>
                        <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded-lg">Submit Review</button>
                        {reviewStatus && <div className="text-center text-sm h-4 mt-2">{reviewStatus}</div>}
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow p-4"><h3 className="font-bold text-lg mb-4">Traceability Log</h3>
                    <ul className="trace-list">
                        {product.traceability.map(log => (
                            <li key={log.log_id} className="trace-item">
                                <p className="font-semibold capitalize">{log.stage}: {log.location}</p>
                                <p className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()} by {log.actor}</p>
                                {log.notes && <p className="text-sm text-blue-600 mt-1">Notes: {log.notes}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {user && <Header userEmail={user.email} userType="consumer" onLogout={handleLogout} />}
            <main className="p-4 md:p-6 flex-grow max-w-lg mx-auto">
                {renderContent()}
            </main>
        </div>
    );
}
