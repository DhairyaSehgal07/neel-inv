import { auth } from '@/auth'; // adjust this import to your auth config path

const Page = async () => {
  // 🧩 Fetch the session on the server using auth()
  const session = await auth();
  const user = session?.user;
  const userName = user?.name || 'User';

  return (
    <div className="p-6">
      <h1 className="text-4xl mb-4">Welcome, {userName} 👋</h1>
      <h2 className="text-2xl mb-2">This is the dashboard screen</h2>
      <pre className="bg-gray-100 text-sm p-4 rounded-md shadow-inner overflow-x-auto">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
};

export default Page;
