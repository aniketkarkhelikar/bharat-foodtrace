export default function BioCard({ wallet, isEditing }) {
    const notSetText = <span className="text-gray-400">Not set</span>;

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4 pb-3 mb-3 border-b border-gray-200">
                 <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Personal Bio-Data</h3>
                    <p className="text-sm text-gray-500">Helps in calculating nutritional needs.</p>
                </div>
            </div>
            
            {!isEditing ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex flex-col"><label className="text-xs text-gray-500">Age</label><span className="font-semibold text-gray-800">{wallet.age || notSetText}</span></div>
                    <div className="flex flex-col"><label className="text-xs text-gray-500">Gender</label><span className="font-semibold text-gray-800 capitalize">{wallet.gender || notSetText}</span></div>
                    <div className="flex flex-col"><label className="text-xs text-gray-500">Height</label><span className="font-semibold text-gray-800">{wallet.height_cm ? `${wallet.height_cm} cm` : notSetText}</span></div>
                    <div className="flex flex-col"><label className="text-xs text-gray-500">Weight</label><span className="font-semibold text-gray-800">{wallet.weight_kg ? `${wallet.weight_kg} kg` : notSetText}</span></div>
                    <div className="flex flex-col col-span-2"><label className="text-xs text-gray-500">Activity Level</label><span className="font-semibold text-gray-800 capitalize">{wallet.activity_level?.replace('_', ' ') || notSetText}</span></div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" name="age" placeholder="Age" defaultValue={wallet.age} className="w-full p-2 border rounded-lg"/>
                        <select name="gender" defaultValue={wallet.gender} className="w-full p-2 border rounded-lg"><option value="">Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <input type="number" name="height_cm" placeholder="Height (cm)" defaultValue={wallet.height_cm} className="w-full p-2 border rounded-lg"/>
                        <input type="number" step="0.1" name="weight_kg" placeholder="Weight (kg)" defaultValue={wallet.weight_kg} className="w-full p-2 border rounded-lg"/>
                    </div>
                    <select name="activity_level" defaultValue={wallet.activity_level} className="w-full p-2 border rounded-lg"><option value="">Activity Level</option><option value="sedentary">Sedentary</option><option value="lightly_active">Lightly Active</option><option value="moderately_active">Moderately Active</option><option value="very_active">Very Active</option></select>
                </div>
            )}
        </div>
    );
}
