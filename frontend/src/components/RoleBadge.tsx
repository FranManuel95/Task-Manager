type Props = {
  isAdmin: boolean;
};

export default function RoleBadge({ isAdmin }: Props) {
  if (isAdmin) {
    return (
      <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs">
        Admin
      </span>
    );
  }
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs">
      Colaborador
    </span>
  );
}
