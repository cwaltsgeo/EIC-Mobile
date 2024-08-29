import { useContext } from 'react';
import { VitalsDataContext } from '../contexts/AppContext';

export default function Vitals() {
    const { vitalsData } = useContext(VitalsDataContext);
    const globalAverage = vitalsData?.globalAverage ?? 'N/A';
    const globalMax = vitalsData?.globalMax ?? 'N/A';

    return (
        <div className="flex justify-between min-h-[80px] w-[327px] px-0 lg:min-h-[67px] lg:px-4">
            <div className='text-center'>
                <p className='text-[14px] font-light leading-[19.12px] lg:text-[12px] lg:leading-[16.39px]'>
                    Average value (ppb)
                </p>
                <h6 className='text-[36px] font-light leading-[48px] tracking-[-0.03em] lg:text-[48px] lg:leading-[64px]'>
                    {globalAverage}
                </h6>
            </div>
            <div className='text-center'>
                <p className='text-[14px] font-light leading-[19.12px] lg:text-[12px] lg:leading-[16.39px]'>
                    Maximum value (ppb)
                </p>
                <h6 className='text-[36px] font-light leading-[48px] tracking-[-0.03em] lg:text-[48px] lg:leading-[64px]'>
                    {globalMax}
                </h6>
            </div>
        </div>
    );
}
