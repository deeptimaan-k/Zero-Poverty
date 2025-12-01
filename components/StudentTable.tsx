import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { User, Phone, Calendar, Hash, MapPin, FileText, ClipboardList, Loader2, Check, AlertCircle } from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  onUpdate: (id: string, admission: string, remark: string) => Promise<void>;
}

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full">
      {/* Card Header */}
      <div className={`px-5 py-4 border-b border-gray-100 flex justify-between items-start ${
        student.Gender === 'F' ? 'bg-pink-50' : 'bg-blue-50'
      }`}>
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-snug">
            {student.StudentName}
          </h3>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">
            Father: {student.FatherName}
          </p>
        </div>
        <div className="flex gap-2 items-center">
           <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
              student.Gender === 'F'
                ? 'bg-pink-100 text-pink-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {student.Gender === 'F' ? 'Female' : 'Male'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4 flex-1">
        {/* Primary Info */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <div className="col-span-2 flex items-center text-gray-600">
            <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span className="font-medium text-gray-900">{student.Age} Years</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-gray-500">{student.DOB || 'N/A'}</span>
          </div>

          <div className="col-span-2 flex items-center text-gray-600">
            <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
            {student.Mobile ? (
              <a href={`tel:${student.Mobile}`} className="text-blue-600 hover:underline">
                {student.Mobile}
              </a>
            ) : (
              <span className="text-gray-400 italic">No mobile</span>
            )}
          </div>

          <div className="col-span-2 flex items-center text-gray-600">
            <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span className="truncate">{student.GramPanchayat}</span>
          </div>
        </div>

        {/* Editable Fields Section */}
        <div className="pt-3 border-t border-gray-100 flex flex-col gap-4">
          {/* Admission Details Input */}
          <div className="space-y-1.5">
            <label className="flex items-center text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              <FileText className="w-3 h-3 mr-1" />
              Admission Status
            </label>
            <textarea 
              value={admission}
              onChange={(e) => setAdmission(e.target.value)}
              className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none min-h-[70px]"
              placeholder="Enter admission details..."
            />
          </div>
          
          {/* Remark Input */}
          <div className="space-y-1.5">
            <label className="flex items-center text-[10px] text-gray-500 uppercase font-bold tracking-wider">
              <ClipboardList className="w-3 h-3 mr-1" />
              Remark
            </label>
            <textarea 
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full text-sm p-2.5 bg-yellow-50/50 border border-yellow-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all outline-none resize-none min-h-[70px]"
              placeholder="Add remarks..."
            />
          </div>
        </div>
        
        {/* Update Button */}
        <div className="flex justify-end pt-2">
            <button
                onClick={handleSave}
                disabled={status === 'saving' || !hasChanges}
                className={`
                    flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-sm
                    ${status === 'saving' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                    ${status === 'saved' ? 'bg-green-100 text-green-700 border border-green-200' : ''}
                    ${status === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : ''}
                    ${status === 'idle' ? 
                        (hasChanges 
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' 
                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed') 
                        : ''}
                `}
            >
                {status === 'saving' && <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Saving...</>}
                {status === 'saved' && <><Check className="w-3 h-3 mr-2" /> Saved</>}
                {status === 'error' && <><AlertCircle className="w-3 h-3 mr-2" /> Failed</>}
                {status === 'idle' && (hasChanges ? 'Update Record' : 'No Changes')}
            </button>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-500">
        <div className="flex items-center font-mono text-gray-400" title="Student ID">
           <Hash className="w-3 h-3 mr-1" />
           {student.ID}
        </div>
        <div title="Family ID">
          Family ID: <span className="font-mono text-gray-700 font-medium">{student.FamilyId.slice(-6)}</span>
        </div>
      </div>
    </div>
  );
};

export const StudentTable: React.FC<StudentTableProps> = ({ students, onUpdate }) => {
  if (students.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
        <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>No students found for this selection.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {students.map((student) => (
        <StudentCard key={student.ID} student={student} onUpdate={onUpdate} />
      ))}
    </div>
  );
};