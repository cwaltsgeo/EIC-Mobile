import { useContext } from 'react';
import { VitalsDataContext } from '../contexts/AppContext';

export default function Vitals() {
    const { vitalsData } = useContext(VitalsDataContext);
    const globalAverage = vitalsData?.globalAverage ?? 'N/A';
    const globalMax = vitalsData?.globalMax ?? 'N/A';

    return (
        <div className=''>
            <div className='flex justify-between min-h-100'>
                <div className='text-center'>
                    <p className='text-sm font-medium tracking-widest text-white lg:text-base'>
                        Average value
                    </p>
                    <h6 className='text-4xl lg:text-5xl'>{globalAverage}</h6>
                </div>
                <div className='text-center'>
                    <p className='text-sm font-medium tracking-widest text-white lg:text-base'>
                        Maximum value
                    </p>
                    <h6 className='text-4xl lg:text-5xl'>{globalMax}</h6>
                </div>
            </div>
        </div>
    );
}
