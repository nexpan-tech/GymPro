export default function SearchInput({ value, onChange }: any) {
  return (
    <input
      className="border p-2 rounded w-full"
      placeholder="Search..."
      value={value}
      onChange={onChange}
    />
  );
}