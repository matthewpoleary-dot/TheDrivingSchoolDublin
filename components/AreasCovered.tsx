// components/AreasCovered.tsx

const AREAS = [
  "Tallaght",
  "Dún Laoghaire",
  "Churchtown",
  "Dundrum",
  "Rathfarnham",
  "Stillorgan",
  "Blackrock",
  "Sandyford",
  "Ballinteer",
  "Kilmacud",
  "Foxrock",
  "Cabinteely",
];

export default function AreasCovered() {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight">Areas We Cover</h2>
        <p className="text-gray-700">Pick-up available in these Dublin locations</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {AREAS.map((area) => (
          <div key={area} className="rounded-lg border bg-white p-4 text-center text-sm font-medium text-gray-900">
            {area}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-gray-600">
        Not sure if we cover your area? <a href="/contact" className="text-red-600 hover:text-red-700 underline">Contact us</a> to check.
      </p>
    </section>
  );
}

