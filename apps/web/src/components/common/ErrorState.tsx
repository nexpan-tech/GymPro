export default function ErrorState({ message = "Something went wrong" }) {
  return (
    <div className="text-center text-red-500 p-6">
      {message}
    </div>
  );
}