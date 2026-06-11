export default function ErrorState({ message = "Something went wrong" }) {
  return (
    <div className="text-center text-primary p-6">
      {message}
    </div>
  );
}