import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { User, Phone, Calendar, Hash, MapPin, FileText, ClipboardList, Loader2, Check, AlertCircle } from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  onUpdate: (id: string, admission: string, remark: string) => Promise<void>;
}

// Helper to format date from ISO/YMD string to dd-mm-yyyy
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  
  // Try to parse YYYY-MM-DD pattern first to avoid timezone shifts from ISO strings
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    return `${day}-${month}-${year}`;
  }

  // Fallback for other formats
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  } catch (e) {
    return dateString;
  }
};

const StudentCard: React.FC<{ student: Student; onUpdate: (id: string, admission: string, remark: string) => Promise<void> }> = ({ student, onUpdate }) => {
  const [admission, setAdmission] = useState(student.AdmissionDetailed || '');
  const [remark, setRemark] = useState(student.Remark || '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync state if student prop updates (e.g. from search filter change or successful update)
  useEffect(() => {
    setAdmission(student.AdmissionDetailed || '');
    setRemark(student.Remark || '');
  }, [student.AdmissionDetailed, student.Remark]);

  const handleSave = async () => {
    if (admission === student.AdmissionDetailed && remark === student.Remark) {
      return; 
    }
    
    setStatus('saving');
    try {
      await onUpdate(student.ID, admission, remark);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };
  
  const hasChanges = admission !== (student.AdmissionDetailed || '') || remark !== (student.Remark || '');

  return (
    <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200/60 shadow-md hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden flex flex-col h-full backdrop-blur-sm">
      {/* Card Header */}
      <div className={`relative px-6 py-5 border-b border-white/50 flex justify-between items-start overflow-hidden ${
        student.Gender === 'F' 
          ? 'bg-gradient-to-r from-pink-50 via-pink-100/50 to-rose-50' 
          : 'bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-100/30'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10 flex-1 min-w-0">
          <h3 className="text-xl font-extrabold text-gray-900 leading-tight mb-1 truncate">
            {student.StudentName}
          </h3>
          <p className="text-xs text-gray-600 font-semibold tracking-wide flex items-center gap-1.5">
            <User className="w-3 h-3" />
            <span className="truncate">Father: {student.FatherName}</span>
          </p>
        </div>
        <div className="flex gap-2 items-start ml-3 relative z-10">
           <span
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full shadow-sm uppercase backdrop-blur-sm ${
              student.Gender === 'F'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
            }`}
          >
            {student.Gender === 'F' ? 'Female' : 'Male'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-5 flex-1">
        {/* Primary Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="col-span-1 sm:col-span-2 flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100/50">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-base">{student.Age} Years</span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-gray-600 text-xs">{formatDate(student.DOB)}</span>
            </div>
          </div>

          <div className="col-span-1 sm:col-span-2 flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100/50">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Phone className="w-4 h-4 text-green-600" />
            </div>
            {student.Mobile ? (
              <a href={`tel:${student.Mobile}`} className="text-green-700 hover:text-green-800 font-semibold hover:underline transition-colors">
                {student.Mobile}
              </a>
            ) : (
              <span className="text-gray-400 italic text-xs">No mobile</span>
            )}
          </div>

          <div className="col-span-1 sm:col-span-2 flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100/50">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <span className="truncate text-gray-700 font-medium">{student.GramPanchayat}</span>
          </div>
        </div>

        {/* Editable Fields Section */}
        <div className="pt-4 border-t border-gray-200 flex flex-col gap-4">
          {/* Admission Details Input */}
          <div className="space-y-2">
            <label className="flex items-center text-[11px] text-gray-600 font-bold tracking-wider gap-1.5">
              <div className="p-1 bg-blue-100 rounded">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
              </div>
              ADMISSION STATUS
            </label>
            <textarea 
              value={admission}
              onChange={(e) => setAdmission(e.target.value)}
              className="w-full text-sm p-3 bg-white border-2 border-gray-200 rounded-xl focus:bg-blue-50/30 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all outline-none resize-none min-h-[80px] hover:border-gray-300 shadow-sm"
              placeholder="Enter admission details..."
            />
          </div>
          
          {/* Remark Input */}
          <div className="space-y-2">
            <label className="flex items-center text-[11px] text-gray-600 font-bold tracking-wider gap-1.5">
              <div className="p-1 bg-amber-100 rounded">
                <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
              </div>
              REMARK
            </label>
            <textarea 
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full text-sm p-3 bg-white border-2 border-amber-200 rounded-xl focus:bg-amber-50/30 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all outline-none resize-none min-h-[80px] hover:border-amber-300 shadow-sm"
              placeholder="Add remarks..."
            />
          </div>
        </div>
        
        {/* Update Button */}
        <div className="flex justify-end pt-3">
            <button
                onClick={handleSave}
                disabled={status === 'saving' || !hasChanges}
                className={`
                    flex items-center px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5
                    ${status === 'saving' ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none' : ''}
                    ${status === 'saved' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-400' : ''}
                    ${status === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-2 border-red-400' : ''}
                    ${status === 'idle' ? 
                        (hasChanges 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:scale-95' 
                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed shadow-none') 
                        : ''}
                `}
            >
                {status === 'saving' && <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>}
                {status === 'saved' && <><Check className="w-4 h-4 mr-2" /> Saved</>}
                {status === 'error' && <><AlertCircle className="w-4 h-4 mr-2" /> Failed</>}
                {status === 'idle' && (hasChanges ? 'Update Record' : 'No Changes')}
            </button>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] text-gray-500">
        <div className="flex items-center gap-1.5 font-mono text-gray-500 bg-white px-3 py-1.5 rounded-lg shadow-sm" title="Student ID">
           <Hash className="w-3.5 h-3.5 text-gray-400" />
           <span className="font-semibold">{student.ID}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm" title="Family ID">
          <span className="text-gray-500">Family ID:</span>
          <span className="font-mono text-gray-800 font-bold">#{student.FamilyId.slice(-6)}</span>
        </div>
      </div>
    </div>
  );
};

export const StudentTable: React.FC<StudentTableProps> = ({ students, onUpdate }) => {
  if (students.length === 0) {
    return (
      <div className="p-16 text-center bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border-2 border-dashed border-gray-300 shadow-inner">
        <div className="max-w-md mx-auto">
          <div className="p-5 bg-white rounded-full w-24 h-24 mx-auto mb-5 shadow-lg">
            <User className="w-14 h-14 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Students Found</h3>
          <p className="text-gray-500 text-sm">No students match your current selection criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-fr">
      {students.map((student) => (
        <StudentCard key={student.ID} student={student} onUpdate={onUpdate} />
      ))}
    </div>
  );
};