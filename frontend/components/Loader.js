export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="loader"></div>
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  );
}
