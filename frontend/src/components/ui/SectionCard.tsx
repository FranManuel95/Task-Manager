import { ReactNode } from "react";

export default function SectionCard({
  title,
  children,
  actions,
}: {
  title: string | ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="px-4 py-2 border-b flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
