import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Search, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Filter
} from 'lucide-react';
import { API_URL } from './constants';
import { Student } from './types';
import { StudentTable } from './components/StudentTable';

function App() {
  const [selectedGP, setSelectedGP] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to normalize data from Sheet to match TypeScript interface
  const normalizeData = (rawData: any[]): Student[] => {
    return rawData.map(item => {
      // Helper to find value case-insensitively
      const getVal = (key: string) => {
        // Direct match
        if (item[key] !== undefined) return item[key];
        // Lowercase match
        const lowerKey = key.toLowerCase();
        const foundKey = Object.keys(item).find(k => k.toLowerCase() === lowerKey);
        return foundKey ? item[foundKey] : undefined;
      };

      // Note: The keys here match the "cleaned" keys produced by code.js
      return {
        ID: String(getVal('ID') || ''),
        FamilyId: String(getVal('FamilyId') || ''),
        GramPanchayat: String(getVal('GramPanchayat') || ''),
        StudentName: String(getVal('StudentName') || 'Unknown'),
        FatherName: String(getVal('FatherName') || ''),
        Aadhaar: String(getVal('Aadhaar') || ''),
        DOB: String(getVal('DOB') || ''),
        Age: Number(getVal('Age')) || 0,
        Mobile: String(getVal('Mobile') || ''),
        Gender: String(getVal('Gender') || 'U'), 
        AdmissionDetailed: String(getVal('AdmissionDetailed') || ''),
        Remark: String(getVal('Remark') || '')
      } as Student;
    });
  };

  // Fetch Data from Google Apps Script
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching from:", API_URL);
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Raw Data received:", data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (Array.isArray(data) && data.length > 0) {
        const normalizedStudents = normalizeData(data);
        console.log("Normalized Data:", normalizedStudents);
        
        setStudents(normalizedStudents);
        
        // Smart GP Selection: Keep current if valid, else select first available
        const availableGPs = Array.from(new Set(normalizedStudents.map(s => s.GramPanchayat))).filter(Boolean).sort();
        if (availableGPs.length > 0) {
          if (!selectedGP || !availableGPs.includes(selectedGP)) {
             setSelectedGP(availableGPs[0]);
          }
        }
      } else {
        console.warn("API returned empty data or invalid format.");
        setStudents([]); 
        if (!selectedGP) setSelectedGP("");
      }

    } catch (err: any) {
      console.error("Fetch failed:", err);
      setStudents([]);
      setError(err.message || "Unable to connect to Google Sheet.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Data Logic
  const handleSaveStudent = async (id: string, admission: string, remark: string) => {
    // Optimistic Update
    const updatedStudents = students.map(s => 
      s.ID === id ? { ...s, AdmissionDetailed: admission, Remark: remark } : s
    );
    setStudents(updatedStudents);

    try {
      // Send update to GAS
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify({
          action: 'update',
          id: id,
          admissionDetailed: admission,
          remark: remark
        })
      });
      
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to save to cloud. Changes are local only.");
    }
  };
  
  // Extract unique GPs
  const gramPanchayats = useMemo(() => {
    const gps = new Set(students.map(s => s.GramPanchayat));
    // Filter out empty GPs
    return Array.from(gps).filter(Boolean).sort();
  }, [students]);

  // Filter Data
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchGP = s.GramPanchayat === selectedGP;
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        s.StudentName.toLowerCase().includes(term) ||
        s.ID.toString().includes(term) ||
        s.Mobile.includes(term);
      
      return matchGP && matchSearch;
    });
  }, [students, selectedGP, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 shadow-lg shadow-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl blur-md opacity-50"></div>
                <div className="relative p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Student Records
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Management System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
              
              {error && (
                <div className="flex items-center text-red-700 bg-red-50 px-4 py-2 rounded-xl border border-red-200 text-xs sm:text-sm shadow-md animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="max-w-[200px] sm:max-w-xs truncate font-semibold">{error}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Controls Card */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-200/50">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Filters</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* GP Selector */}
              <div className="relative flex-1 sm:flex-none sm:w-72">
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                  Gram Panchayat
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-indigo-500" />
                  </div>
                  <select
                    value={selectedGP}
                    onChange={(e) => setSelectedGP(e.target.value)}
                    className="pl-12 pr-10 py-3 w-full border-2 border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold shadow-sm appearance-none outline-none transition-all hover:border-gray-300"
                  >
                    {gramPanchayats.length === 0 ? (
                      <option value="">{isLoading ? "Loading..." : "No Data Found"}</option>
                    ) : (
                      gramPanchayats.map(gp => (
                        <option key={gp} value={gp}>{gp}</option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative flex-1">
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                  Search Students
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Name, ID, or mobile number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm outline-none transition-all hover:border-gray-300 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* List Title & Count */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Students</h2>
                <p className="text-xs text-gray-500 font-medium">Manage records efficiently</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200">
                {filteredStudents.length} Record{filteredStudents.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Data Cards */}
          {isLoading && students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
                <div className="relative p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
                  <Loader2 className="w-12 h-12 animate-spin text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-700 text-lg font-bold">Syncing with Google Sheets</p>
                <p className="text-gray-500 text-sm mt-1">Please wait while we fetch the latest data...</p>
              </div>
            </div>
          ) : error && students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-red-200">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl"></div>
                <div className="relative p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-200 shadow-xl">
                  <AlertCircle className="w-14 h-14 text-red-500" />
                </div>
              </div>
              <div className="max-w-md">
                <h3 className="text-2xl font-black text-gray-900 mb-2">Connection Failed</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{error}</p>
                <button 
                  onClick={fetchData}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 inline-flex items-center shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Connection
                </button>
              </div>
            </div>
          ) : (
            <StudentTable 
              students={filteredStudents} 
              onUpdate={handleSaveStudent}
            />
          )}
        </main>

        {/* Footer */}
       
      </div>
    </div>
  );
}

export default App;