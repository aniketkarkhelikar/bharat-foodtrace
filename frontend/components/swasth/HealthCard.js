export default function HealthCard({ wallet, isEditing }) {
    const notSetText = <span className="text-gray-400">Not set</span>;
    const createTags = (dataArray) => {
        if (!dataArray || dataArray.length === 0) return notSetText;
        return dataArray.map(item => <span key={item} className="tag capitalize">{item.replace(/_/g, ' ')}</span>);
    };

    const allergies = ["peanuts", "tree_nuts", "milk", "eggs", "fish", "shellfish", "wheat", "soy"];
    const conditions = ["diabetes", "high blood pressure", "high cholesterol", "celiac disease"];

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4 pb-3 mb-3 border-b border-gray-200">
                <div className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-lg">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Health Profile</h3>
                    <p className="text-sm text-gray-500">Critical for safety alerts and warnings.</p>
                </div>
            </div>
            
            {!isEditing ? (
                 <div className="space-y-3">
                    <div><label className="text-xs text-gray-500">Allergies</label><div className="flex flex-wrap gap-2 mt-1">{createTags(wallet.allergies)}</div></div>
                    <div><label className="text-xs text-gray-500">Existing Conditions</label><div className="flex flex-wrap gap-2 mt-1">{createTags(wallet.conditions)}</div></div>
                </div>
            ) : (
                <div className="space-y-4">
                     <div>
                        <label className="font-semibold text-gray-700 text-sm">Allergies</label>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            {allergies.map(allergy => (
                                <label key={allergy} className="flex items-center"><input type="checkbox" name="allergies" value={allergy} defaultChecked={wallet.allergies?.includes(allergy)}/> <span className="ml-2 capitalize">{allergy.replace('_', ' ')}</span></label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="font-semibold text-gray-700 text-sm">Existing Conditions</label>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                             {conditions.map(condition => (
                                <label key={condition} className="flex items-center"><input type="checkbox" name="conditions" value={condition} defaultChecked={wallet.conditions?.includes(condition)}/> <span className="ml-2 capitalize">{condition}</span></label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
