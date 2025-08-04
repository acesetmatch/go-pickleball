import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Pickleball Database
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Explore our comprehensive collection of pickleball paddles with detailed specifications, 
            performance metrics, and expert reviews.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/paddles"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
            >
              Browse Paddles
            </Link>
            <Link 
              href="/paddles?source=json"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
            >
              View Sample Data
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Comprehensive Database
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access detailed information about hundreds of pickleball paddles from top brands.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Performance Metrics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Compare power, spin, and other performance characteristics to find your perfect paddle.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Expert Reviews
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get insights from professional players and equipment experts to make informed decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
