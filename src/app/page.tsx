import Image from 'next/image';
import Note from '../components/Note';

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Notebook App</h1>
      <Note />
    </div>
  );
}
