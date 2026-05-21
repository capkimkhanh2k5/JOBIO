import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlSearchParam(paramName = 'search') {
    const [searchParams] = useSearchParams();
    const urlValue = searchParams.get(paramName) ?? '';
    const [value, setValue] = useState(urlValue);

    useEffect(() => {
        setValue(urlValue);
    }, [urlValue]);

    return [value, setValue] as const;
}
