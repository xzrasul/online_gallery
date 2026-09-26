// A table in a legal document. On phones each row turns into a small card,
// and every cell but the first is prefixed with its column name (data-label).
export function DocTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="doc-table">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]}>
            {row.map((cell, i) => (
              <td key={i} data-label={i > 0 ? head[i] : undefined}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
