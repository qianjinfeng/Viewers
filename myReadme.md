"1 86987 wadors:http://127.0.0.1:8080/ipfs/QmerVyUkED7Rhyz9G3DEHA4mFyt91yQ47GxXTmehPhQmZY"
imageData.scalarArray is fixed size to 1st image 86987

"3 88797 355188 wadors:http://127.0.0.1:8080/ipfs/QmNizpvvqfEaZQH7MUUX2ARon5qwaibeEfJB3PSEbEoacm"
updateVTKImageDataWithCornerstoneImage
scalarData.set(pixelData);  exception as 88797 > 86987

"512X512X16/8=524288 bytes 90549 wadors:http://127.0.0.1:8080/ipfs/QmXFoqScd5x3B9ovCEe2MsyupQuam1jjdr7VxEgFGpyQ6n" ~/Downloads/dicom/2/DICOM/I5  pixeldata 181098

"78131 wadors:http://127.0.0.1:8080/ipfs/QmZMNDwuv6yLUZ57cGUmAonAHoDhyyrJ5Jw5cH7F7fip4V"
"93610 wadors:http://127.0.0.1:8080/ipfs/QmUgzzheaAyg4uAHyKXvKpf5W8PMeQ1bV4nKFFteEamjzb"


"9 wadors:http://127.0.0.1:8080/ipfs/QmSACcDMC6mKHNAKX1n7PiMHCD2cLDHL7J21CoFbM7jA42"
"8 wadors:http://127.0.0.1:8080/ipfs/QmVbtSaMyVBn8mtXWo3ETkpucnxooJ2mnJn1DEs3ituxj5"

GET /instance/_search
{
  "query": {
     "bool": {
      "must": [
        {
    "term": {
      "PixelData.BulkDataURI.keyword": "QmerVyUkED7Rhyz9G3DEHA4mFyt91yQ47GxXTmehPhQmZY"
    }
        }]}
  }
}
