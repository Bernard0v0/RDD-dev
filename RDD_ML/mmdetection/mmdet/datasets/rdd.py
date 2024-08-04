from mmdet.datasets.xml_style import XMLDataset
from mmdet.registry import DATASETS


@DATASETS.register_module()
class RDDDataset(XMLDataset):
    METAINFO = {
        'classes':('D00','D10','D20','D40')}
    ANN_ID_UNIQUE = True

    def __init__(self, **kwargs):
        super(RDDDataset, self).__init__(**kwargs)