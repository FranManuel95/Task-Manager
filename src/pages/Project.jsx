import { useParams } from "react-router-dom";

export default function Project() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Proyecto ID: {id}</h1>
    </div>
  );
}
