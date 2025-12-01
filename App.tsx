import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Search, 
  AlertCircle,
  Loader2,
  RefreshCw
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow-md shadow-blue-200">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block tracking-tight">
              Student Records
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
             {error && (
               <div className="flex items-center text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 text-xs sm:text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
                 <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                 <span className="max-w-[200px] sm:max-w-xs truncate font-medium">{error}</span>
               </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Controls - Removed sticky positioning as requested */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* GP Selector */}
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={selectedGP}
                onChange={(e) => setSelectedGP(e.target.value)}
                className="pl-10 pr-8 py-2.5 w-full border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm appearance-none outline-none transition-shadow"
              >
                {gramPanchayats.length === 0 ? (
                  <option value="">{isLoading ? "Loading..." : "No Data Found"}</option>
                ) : (
                  gramPanchayats.map(gp => (
                    <option key={gp} value={gp}>{gp}</option>
                  ))
                )}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search name, ID, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm outline-none transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* List Title & Count */}
        <div className="flex items-center justify-between px-1">
           <h2 className="text-lg font-bold text-gray-900 tracking-tight">Student List</h2>
           <span className="px-3 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-semibold">
             {filteredStudents.length} Record{filteredStudents.length !== 1 ? 's' : ''}
           </span>
        </div>

        {/* Data Cards */}
        {isLoading && students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-gray-500 text-sm font-medium">Syncing with Google Sheets...</p>
          </div>
        ) : error && students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
             <div className="p-4 bg-red-50 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-500" />
             </div>
             <div className="max-w-md">
               <h3 className="text-lg font-semibold text-gray-900">Connection Failed</h3>
               <p className="text-gray-500 mt-2 text-sm">{error}</p>
               <button 
                onClick={fetchData}
                className="mt-6 px-4 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 inline-flex items-center"
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
    </div>
  );
}

export default App;