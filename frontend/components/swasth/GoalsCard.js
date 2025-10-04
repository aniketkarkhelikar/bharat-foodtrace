export default function GoalsCard({ wallet, isEditing }) {
    const notSetText = <span className="text-gray-400">Not set</span>;
    const createTags = (dataArray) => {
        if (!dataArray || dataArray.length === 0) return notSetText;
        return dataArray.map(item => <span key={item} className="tag capitalize">{item.replace(/_/g, ' ')}</span>);
    };

    const diets = ["vegetarian", "vegan", "jain"];
    const goals = ["weight_loss", "weight_gain", "muscle_building", "general_fitness"];

    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex items-center gap-4 pb-3 mb-3 border-b border-gray-200">
                <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-lg">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Goals & Preferences</h3>
                    <p className="text-sm text-gray-500">Fine-tune your dietary recommendations.</p>
                </div>
            </div>

            {!isEditing ? (
                <div className="space-y-3">
                    <div><label className="text-xs text-gray-500">Dietary Preferences</label><div className="flex flex-wrap gap-2 mt-1">{createTags(wallet.diet)}</div></div>
                    <div><label className="text-xs text-gray-500">Health Goals</label><div className="flex flex-wrap gap-2 mt-1">{createTags(wallet.goals)}</div></div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="font-semibold text-gray-700 text-sm">Dietary Preferences</label>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            {diets.map(diet => (
                                <label key={diet} className="flex items-center"><input type="checkbox" name="diet" value={diet} defaultChecked={wallet.diet?.includes(diet)}/> <span className="ml-2 capitalize">{diet}</span></label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="font-semibold text-gray-700 text-sm">Main Health Goals</label>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                           {goals.map(goal => (
                                <label key={goal} className="flex items-center"><input type="checkbox" name="goals" value={goal} defaultChecked={wallet.goals?.includes(goal)}/> <span className="ml-2 capitalize">{goal.replace('_', ' ')}</span></label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
