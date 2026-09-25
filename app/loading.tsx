// Shown the moment a link is clicked, while the next page renders on the
// server: the header stays, the content area gets a quiet gold spinner.
export default function Loading() {
  return (
    <div className="page-wait" role="status" aria-label="Загрузка">
      <span className="page-wait-ring" aria-hidden="true" />
    </div>
  );
}
