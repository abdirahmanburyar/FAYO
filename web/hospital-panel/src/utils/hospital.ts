export function getHospitalId(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hospitalData = localStorage.getItem('hospitalData');
  if (!hospitalData) return null;
  
  try {
    const hospital = JSON.parse(hospitalData);
    return hospital.id || null;
  } catch {
    return null;
  }
}

export function getHospitalData(): { id: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  
  const hospitalData = localStorage.getItem('hospitalData');
  if (!hospitalData) return null;
  
  try {
    return JSON.parse(hospitalData);
  } catch {
    return null;
  }
}

