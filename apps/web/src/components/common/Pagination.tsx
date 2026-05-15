export default function Pagination({ page, setPage }: any) {
  return (
    <div className="flex gap-2">
      <button onClick={() => setPage(page - 1)}>Prev</button>
      <span>{page}</span>
      <button onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
}